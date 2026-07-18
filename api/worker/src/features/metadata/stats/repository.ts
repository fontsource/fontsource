import type { FontCatalog } from '../../../../../shared/catalog';
import legacyFontIds from '../../../../../shared/legacy-fonts.json';
import type { StatsResponse } from '../../../../../shared/stats';

// Three values per seed keeps each statement below D1's 100-parameter limit.
const SEED_BATCH_SIZE = 32;

interface StatsPackageRow {
	created_day: string | null;
	last_success_at: string | null;
}

interface AggregatedStatsRow {
	family_id: string;
	variable_packages: number;
	static_npm_monthly: number;
	static_npm_total: number;
	static_jsdelivr_monthly: number;
	static_jsdelivr_total: number;
	variable_npm_monthly: number;
	variable_npm_total: number;
	variable_jsdelivr_monthly: number;
	variable_jsdelivr_total: number;
}

export interface StatsPeriodWrite {
	provider: 'npm' | 'jsdelivr';
	year: number;
	total: number;
}

const upsertStatsPeriod = (
	env: Env,
	packageName: string,
	period: StatsPeriodWrite,
): D1PreparedStatement =>
	env.STATS.prepare(
		`INSERT INTO stats_periods (package_name, provider, year, total)
		VALUES (?, ?, ?, ?)
		ON CONFLICT(package_name, provider, year) DO UPDATE SET
			total = excluded.total`,
	).bind(packageName, period.provider, period.year, period.total);

export const getStats = async (
	env: Env,
	familyId?: string,
): Promise<Record<string, StatsResponse>> => {
	const familyFilter = familyId === undefined ? '' : ' AND p.family_id = ?';
	const statement = env.STATS.prepare(
		`WITH package_totals AS (
			SELECT
				p.package_name,
				p.family_id,
				p.kind,
				p.npm_monthly,
				p.jsdelivr_monthly,
				SUM(CASE WHEN s.provider = 'npm' THEN s.total ELSE 0 END) AS npm_total,
				SUM(CASE WHEN s.provider = 'jsdelivr' THEN s.total ELSE 0 END) AS jsdelivr_total
			FROM stats_packages p
			LEFT JOIN stats_periods s ON s.package_name = p.package_name
			WHERE p.active = 1${familyFilter}
			GROUP BY p.package_name
		)
		SELECT
			family_id,
			SUM(CASE WHEN kind = 'variable' THEN 1 ELSE 0 END) AS variable_packages,
			SUM(CASE WHEN kind = 'variable' THEN 0 ELSE npm_monthly END) AS static_npm_monthly,
			SUM(CASE WHEN kind = 'variable' THEN 0 ELSE npm_total END) AS static_npm_total,
			SUM(CASE WHEN kind = 'variable' THEN 0 ELSE jsdelivr_monthly END) AS static_jsdelivr_monthly,
			SUM(CASE WHEN kind = 'variable' THEN 0 ELSE jsdelivr_total END) AS static_jsdelivr_total,
			SUM(CASE WHEN kind = 'variable' THEN npm_monthly ELSE 0 END) AS variable_npm_monthly,
			SUM(CASE WHEN kind = 'variable' THEN npm_total ELSE 0 END) AS variable_npm_total,
			SUM(CASE WHEN kind = 'variable' THEN jsdelivr_monthly ELSE 0 END) AS variable_jsdelivr_monthly,
			SUM(CASE WHEN kind = 'variable' THEN jsdelivr_total ELSE 0 END) AS variable_jsdelivr_total
		FROM package_totals
		GROUP BY family_id
		ORDER BY family_id`,
	);
	const result = await (familyId === undefined
		? statement
		: statement.bind(familyId)
	).all<AggregatedStatsRow>();

	return Object.fromEntries(
		result.results.map((row) => {
			const staticStats = {
				npmDownloadMonthly: row.static_npm_monthly,
				npmDownloadTotal: row.static_npm_total,
				jsDelivrHitsMonthly: row.static_jsdelivr_monthly,
				jsDelivrHitsTotal: row.static_jsdelivr_total,
			};
			const variableStats = {
				npmDownloadMonthly: row.variable_npm_monthly,
				npmDownloadTotal: row.variable_npm_total,
				jsDelivrHitsMonthly: row.variable_jsdelivr_monthly,
				jsDelivrHitsTotal: row.variable_jsdelivr_total,
			};

			return [
				row.family_id,
				{
					static: staticStats,
					...(row.variable_packages > 0 ? { variable: variableStats } : {}),
					total: {
						npmDownloadMonthly:
							staticStats.npmDownloadMonthly + variableStats.npmDownloadMonthly,
						npmDownloadTotal:
							staticStats.npmDownloadTotal + variableStats.npmDownloadTotal,
						jsDelivrHitsMonthly:
							staticStats.jsDelivrHitsMonthly +
							variableStats.jsDelivrHitsMonthly,
						jsDelivrHitsTotal:
							staticStats.jsDelivrHitsTotal + variableStats.jsDelivrHitsTotal,
					},
				},
			];
		}),
	);
};

// Unscoped packages are deprecated and no longer discoverable from the catalog.
const packageSeeds = (catalog: FontCatalog) => [
	...Object.values(catalog).flatMap((font) => [
		{
			packageName: `@fontsource/${font.id}`,
			familyId: font.id,
			kind: 'static' as const,
		},
		...(font.variable
			? [
					{
						packageName: `@fontsource-variable/${font.id}`,
						familyId: font.id,
						kind: 'variable' as const,
					},
				]
			: []),
	]),
	...legacyFontIds.map((familyId) => ({
		packageName: `fontsource-${familyId}`,
		familyId,
		kind: 'legacy' as const,
	})),
];

export const seedStatsPackages = async (
	env: Env,
	catalog: FontCatalog,
): Promise<void> => {
	const seeds = packageSeeds(catalog);
	const statements: D1PreparedStatement[] = [
		env.STATS.prepare(
			`UPDATE stats_packages
			SET active = 0
			WHERE kind IN ('static', 'variable')`,
		),
	];

	for (let index = 0; index < seeds.length; index += SEED_BATCH_SIZE) {
		const batch = seeds.slice(index, index + SEED_BATCH_SIZE);
		const placeholders = batch.map(() => '(?, ?, ?)').join(', ');
		const values = batch.flatMap((seed) => [
			seed.packageName,
			seed.familyId,
			seed.kind,
		]);

		statements.push(
			env.STATS.prepare(
				`INSERT INTO stats_packages (package_name, family_id, kind)
				VALUES ${placeholders}
				ON CONFLICT(package_name) DO UPDATE SET
					family_id = excluded.family_id,
					kind = excluded.kind,
					active = CASE
						WHEN excluded.kind = 'legacy' THEN stats_packages.active
						ELSE 1
					END`,
			).bind(...values),
		);
	}

	await env.STATS.batch(statements);
};

export const getStatsPackageNamesToRefresh = async (
	env: Env,
): Promise<string[]> => {
	const packages = await env.STATS.prepare(
		`SELECT package_name
		FROM stats_packages
		WHERE active = 1 AND (
			last_success_at IS NULL OR NOT EXISTS (
				SELECT 1 FROM stats_packages AS pending
				WHERE pending.active = 1 AND pending.last_success_at IS NULL
			)
		)
		ORDER BY package_name`,
	).all<{ package_name: string }>();

	return packages.results.map(({ package_name }) => package_name);
};

export const getStatsPackage = (
	env: Env,
	packageName: string,
): Promise<StatsPackageRow | null> =>
	env.STATS.prepare(
		`SELECT created_day, last_success_at
		FROM stats_packages WHERE package_name = ? AND active = 1`,
	)
		.bind(packageName)
		.first<StatsPackageRow>();

export const prepareStatsBackfill = async (
	env: Env,
	packageName: string,
	createdDay: string,
): Promise<StatsPeriodWrite[]> => {
	await env.STATS.prepare(
		`UPDATE stats_packages SET created_day = ? WHERE package_name = ?`,
	)
		.bind(createdDay, packageName)
		.run();

	const periods = await env.STATS.prepare(
		`SELECT provider, year, total
		FROM stats_periods WHERE package_name = ?`,
	)
		.bind(packageName)
		.all<StatsPeriodWrite>();

	return periods.results;
};

export const saveStatsPeriod = async (
	env: Env,
	packageName: string,
	period: StatsPeriodWrite,
): Promise<void> => {
	await upsertStatsPeriod(env, packageName, period).run();
};

export const markStatsPackageInactive = async (
	env: Env,
	packageName: string,
): Promise<void> => {
	await env.STATS.prepare(
		`UPDATE stats_packages
		SET active = 0, last_error = NULL
		WHERE package_name = ?`,
	)
		.bind(packageName)
		.run();
};

export const recordStatsFailure = async (
	env: Env,
	packageName: string,
	error: string,
): Promise<void> => {
	await env.STATS.prepare(
		`UPDATE stats_packages
		SET last_error = ?
		WHERE package_name = ?`,
	)
		.bind(error.slice(0, 1000), packageName)
		.run();
};

export const commitStatsPackage = async (
	env: Env,
	input: {
		packageName: string;
		createdDay: string;
		npmMonthly: number;
		jsdelivrMonthly: number;
		periods: StatsPeriodWrite[];
		refreshedAt: Date;
	},
): Promise<void> => {
	const statements = input.periods.map((period) =>
		upsertStatsPeriod(env, input.packageName, period),
	);

	statements.push(
		env.STATS.prepare(
			`UPDATE stats_packages SET
				created_day = ?,
				npm_monthly = ?,
				jsdelivr_monthly = ?,
				last_success_at = ?,
				last_error = NULL
			WHERE package_name = ?`,
		).bind(
			input.createdDay,
			input.npmMonthly,
			input.jsdelivrMonthly,
			input.refreshedAt.toISOString(),
			input.packageName,
		),
	);

	await env.STATS.batch(statements);
};
