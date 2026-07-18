import type { FontCatalog } from '../../../../../shared/catalog';
import { KV_KEYS } from '../../../constants';
import { refreshCatalog } from '../refresh';
import {
	fetchJsDelivrDownloads,
	fetchNpmDownloads,
	fetchNpmMonthlyDownloads,
	fetchPackageCreatedDay,
	JSDELIVR_STATS_START_YEAR,
	NPM_STATS_START_YEAR,
} from './providers';
import {
	commitStatsPackage,
	getStatsPackage,
	getStatsPackageNamesToRefresh,
	markStatsPackageInactive,
	prepareStatsBackfill,
	recordStatsFailure,
	type StatsPeriodWrite,
	saveStatsPeriod,
	seedStatsPackages,
} from './repository';

const QUEUE_BATCH_SIZE = 100;

export interface StatsQueueMessage {
	packageName: string;
}

const yearsToRefresh = (
	startYear: number,
	currentYear: number,
	initialRefresh: boolean,
	isJanuary: boolean,
): number[] => {
	if (initialRefresh) {
		return Array.from(
			{ length: currentYear - startYear + 1 },
			(_, index) => startYear + index,
		);
	}

	// Provider yearly summaries lag, so January refinalizes the previous year.
	return isJanuary && currentYear - 1 >= startYear
		? [currentYear - 1, currentYear]
		: [currentYear];
};

const processStatsPackage = async (
	env: Env,
	packageName: string,
	now = new Date(),
): Promise<void> => {
	const row = await getStatsPackage(env, packageName);
	if (!row) return;

	const createdDay =
		row.created_day ?? (await fetchPackageCreatedDay(packageName));
	if (createdDay === null) {
		await markStatsPackageInactive(env, packageName);
		return;
	}

	const today = now.toISOString().slice(0, 10);
	const currentYear = now.getUTCFullYear();
	const createdYear = new Date(`${createdDay}T00:00:00.000Z`).getUTCFullYear();
	const initialRefresh = row.last_success_at === null;
	const isJanuary = now.getUTCMonth() === 0;
	const npmYears = yearsToRefresh(
		Math.max(NPM_STATS_START_YEAR, createdYear),
		currentYear,
		initialRefresh,
		isJanuary,
	);
	const jsdelivrYears = yearsToRefresh(
		Math.max(JSDELIVR_STATS_START_YEAR, createdYear),
		currentYear,
		initialRefresh,
		isJanuary,
	);
	const completedPeriods = initialRefresh
		? await prepareStatsBackfill(env, packageName, createdDay)
		: [];
	const periods: StatsPeriodWrite[] = [];
	const collectPeriod = async (period: StatsPeriodWrite): Promise<void> => {
		if (initialRefresh) {
			await saveStatsPeriod(env, packageName, period);
			return;
		}

		periods.push(period);
	};
	const needsPeriod = (
		provider: StatsPeriodWrite['provider'],
		year: number,
	): boolean =>
		// Historical totals are final; always refresh the current year on retry.
		year === currentYear ||
		!completedPeriods.some(
			(period) => period.provider === provider && period.year === year,
		);

	const npmMonthly = await fetchNpmMonthlyDownloads(packageName);
	for (const year of npmYears) {
		if (!needsPeriod('npm', year)) continue;
		await collectPeriod({
			provider: 'npm',
			year,
			total: await fetchNpmDownloads(packageName, year, createdDay, today),
		});
	}

	const jsdelivrMonthly = await fetchJsDelivrDownloads(packageName, 'month');
	for (const year of jsdelivrYears) {
		if (!needsPeriod('jsdelivr', year)) continue;
		await collectPeriod({
			provider: 'jsdelivr',
			year,
			total: await fetchJsDelivrDownloads(packageName, year),
		});
	}

	await commitStatsPackage(env, {
		packageName,
		createdDay,
		npmMonthly,
		jsdelivrMonthly,
		periods,
		refreshedAt: now,
	});
};

export const scheduleStatsRefresh = async (env: Env): Promise<void> => {
	const catalog =
		(await env.METADATA.get<FontCatalog>(KV_KEYS.catalog, { type: 'json' })) ??
		(await refreshCatalog(env));
	await seedStatsPackages(env, catalog);
	const packageNames = await getStatsPackageNamesToRefresh(env);

	for (let index = 0; index < packageNames.length; index += QUEUE_BATCH_SIZE) {
		await env.STATS_QUEUE.sendBatch(
			packageNames
				.slice(index, index + QUEUE_BATCH_SIZE)
				.map((packageName) => ({
					body: { packageName },
				})),
		);
	}
};

const isStatsQueueMessage = (value: unknown): value is StatsQueueMessage =>
	typeof value === 'object' &&
	value !== null &&
	'packageName' in value &&
	typeof value.packageName === 'string';

export const consumeStatsQueue = async (
	batch: MessageBatch<StatsQueueMessage>,
	env: Env,
): Promise<void> => {
	for (const message of batch.messages) {
		if (!isStatsQueueMessage(message.body)) {
			console.error('Discarding invalid stats queue message');
			message.ack();
			continue;
		}

		try {
			await processStatsPackage(env, message.body.packageName);
			message.ack();
		} catch (error) {
			const statsError =
				error instanceof Error ? error : new Error(String(error));
			await recordStatsFailure(
				env,
				message.body.packageName,
				statsError.message,
			);
			message.retry();
		}
	}
};
