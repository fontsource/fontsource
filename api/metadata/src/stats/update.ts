import type { VersionResponse } from 'common-api/types';
import { StatusError } from 'itty-router';

import { KV_TTL, METADATA_KEYS } from '../utils';
import type { StatsResponseAllRecord } from './types';
import { getAvailableVersions } from './util';

export const updateVersion = async (
	id: string,
	isVariable: boolean,
	env: Env,
	ctx: ExecutionContext,
) => {
	const [staticVal, variable] = await Promise.all([
		getAvailableVersions(id),
		isVariable ? getAvailableVersions(id, isVariable) : undefined,
	]);

	if (!staticVal || staticVal.length === 0) {
		throw new StatusError(404, `Not found. No versions found for ${id}.`);
	}

	const resp: VersionResponse = {
		latest: staticVal[0],
		static: staticVal,
		...(variable && { latestVariable: variable[0], variable }),
	};

	// Add to KV cache
	ctx.waitUntil(
		env.VERSIONS.put(METADATA_KEYS.version(id), JSON.stringify(resp), {
			expirationTtl: KV_TTL, // We want to expire these as we can't cron trigger these yet
		}),
	);

	return resp;
};

export const updatePackageStatAll = async (env: Env, ctx: ExecutionContext) => {
	const [npmMonthlyResp, npmTotalResp, jsDelivrMonthlyResp, jsDelivrTotalResp] =
		await Promise.all([
			fetch(
				'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/lastMonthPopular.json',
			),
			fetch(
				'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/totalPopular.json',
			),
			fetch(
				'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/jsDelivrMonthPopular.json',
			),
			fetch(
				'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/jsDelivrTotalPopular.json',
			),
		]);

	const [npmMonthData, npmTotalData, jsDelivrMonthData, jsDelivrTotalData] =
		(await Promise.all([
			npmMonthlyResp.json(),
			npmTotalResp.json(),
			jsDelivrMonthlyResp.json(),
			jsDelivrTotalResp.json(),
		])) as [
			Record<string, number>,
			Record<string, number>,
			Record<string, number>,
			Record<string, number>,
		];

	const stats: StatsResponseAllRecord = {};

	for (const packageName of Object.keys(npmMonthData)) {
		// Check for scoped packages
		if (packageName.startsWith('@')) {
			const [type, id] = packageName.split('/');
			const isVariable = type === '@fontsource-variable';

			// Initialise stats object
			stats[id] = stats[id] || {
				total: {
					npmDownloadMonthly: 0,
					npmDownloadTotal: 0,
					jsDelivrHitsMonthly: 0,
					jsDelivrHitsTotal: 0,
				},
				static: {
					npmDownloadMonthly: 0,
					npmDownloadTotal: 0,
					jsDelivrHitsMonthly: 0,
					jsDelivrHitsTotal: 0,
				},
				variable: isVariable
					? {
							npmDownloadMonthly: 0,
							npmDownloadTotal: 0,
							jsDelivrHitsMonthly: 0,
							jsDelivrHitsTotal: 0,
						}
					: undefined,
			};

			if (isVariable) {
				stats[id].variable = stats[id].variable ?? {
					npmDownloadMonthly: 0,
					npmDownloadTotal: 0,
					jsDelivrHitsMonthly: 0,
					jsDelivrHitsTotal: 0,
				};

				// biome-ignore lint/style/noNonNullAssertion: Selective.
				stats[id].variable!.npmDownloadMonthly +=
					npmMonthData[packageName] ?? 0;

				// biome-ignore lint/style/noNonNullAssertion: Selective.
				stats[id].variable!.npmDownloadTotal += npmTotalData[packageName] ?? 0;

				// biome-ignore lint/style/noNonNullAssertion: Selective.
				stats[id].variable!.jsDelivrHitsMonthly +=
					jsDelivrMonthData[packageName] ?? 0;
				// biome-ignore lint/style/noNonNullAssertion: Selective.
				stats[id].variable!.jsDelivrHitsTotal +=
					jsDelivrTotalData[packageName] ?? 0;
			} else {
				stats[id].static.npmDownloadMonthly += npmMonthData[packageName] ?? 0;
				stats[id].static.npmDownloadTotal += npmTotalData[packageName] ?? 0;
				stats[id].static.jsDelivrHitsMonthly +=
					jsDelivrMonthData[packageName] ?? 0;
				stats[id].static.jsDelivrHitsTotal +=
					jsDelivrTotalData[packageName] ?? 0;
			}
		} else {
			// Handle unscoped deprecated packages
			const id = packageName.replace('fontsource-', '');
			stats[id] = stats[id] || {
				total: {
					npmDownloadMonthly: 0,
					npmDownloadTotal: 0,
					jsDelivrHitsMonthly: 0,
					jsDelivrHitsTotal: 0,
				},
				static: {
					npmDownloadMonthly: 0,
					npmDownloadTotal: 0,
					jsDelivrHitsMonthly: 0,
					jsDelivrHitsTotal: 0,
				},
			};

			stats[id].static.npmDownloadMonthly += npmMonthData[packageName] ?? 0;
			stats[id].static.npmDownloadTotal += npmTotalData[packageName] ?? 0;
			stats[id].static.jsDelivrHitsMonthly +=
				jsDelivrMonthData[packageName] ?? 0;
			stats[id].static.jsDelivrHitsTotal += jsDelivrTotalData[packageName] ?? 0;
		}
	}

	// Calculate totals for all packages
	for (const key of Object.keys(stats)) {
		stats[key].total.npmDownloadMonthly += stats[key].static.npmDownloadMonthly;
		stats[key].total.npmDownloadTotal += stats[key].static.npmDownloadTotal;
		stats[key].total.jsDelivrHitsMonthly +=
			stats[key].static.jsDelivrHitsMonthly;
		stats[key].total.jsDelivrHitsTotal += stats[key].static.jsDelivrHitsTotal;

		// Add variable stats if available
		if (stats[key].variable) {
			stats[key].total.npmDownloadMonthly +=
				stats[key].variable?.npmDownloadMonthly ?? 0;
			stats[key].total.npmDownloadTotal +=
				stats[key].variable?.npmDownloadTotal ?? 0;
			stats[key].total.jsDelivrHitsMonthly +=
				stats[key].variable?.jsDelivrHitsMonthly ?? 0;
			stats[key].total.jsDelivrHitsTotal +=
				stats[key].variable?.jsDelivrHitsTotal ?? 0;
		}
	}

	// Add to KV cache
	ctx.waitUntil(
		env.METADATA.put(METADATA_KEYS.downloads, JSON.stringify(stats)),
	);
	return stats;
};
