import {
	type AxisRegistry,
	type AxisRegistryItem,
	buildAxisRegistry,
} from '../../../../shared/axis-registry';
import type { FontCatalog } from '../../../../shared/catalog';
import {
	buildStatsResponse,
	type StatsResponse,
} from '../../../../shared/stats';
import { fetchCachedJson } from '../../../../shared/upstream';
import { KV_CACHE_TTLS, KV_KEYS, UPSTREAM_URLS } from '../../constants';

type StatsRecord = Record<string, StatsResponse>;

/**
 * Merges NPM and jsDelivr stats into the public stats response shape.
 *
 * Static and variable packages are published separately, so totals have to be
 * recomputed after both sides are merged by family id.
 */
const aggregateStats = (
	npmMonthData: Record<string, number>,
	npmTotalData: Record<string, number>,
	jsDelivrMonthData: Record<string, number>,
	jsDelivrTotalData: Record<string, number>,
): StatsRecord => {
	const stats: StatsRecord = {};
	const packageNames = new Set([
		...Object.keys(npmMonthData),
		...Object.keys(npmTotalData),
		...Object.keys(jsDelivrMonthData),
		...Object.keys(jsDelivrTotalData),
	]);

	for (const packageName of packageNames) {
		const scoped = packageName.startsWith('@');
		const id = scoped
			? (packageName.split('/')[1] as string)
			: packageName.replace('fontsource-', '');
		const isVariable =
			scoped && packageName.startsWith('@fontsource-variable/');
		const current = stats[id] ?? buildStatsResponse(undefined, isVariable);

		if (isVariable) {
			current.variable = current.variable ?? {
				npmDownloadMonthly: 0,
				npmDownloadTotal: 0,
				jsDelivrHitsMonthly: 0,
				jsDelivrHitsTotal: 0,
			};
			current.variable.npmDownloadMonthly += npmMonthData[packageName] ?? 0;
			current.variable.npmDownloadTotal += npmTotalData[packageName] ?? 0;
			current.variable.jsDelivrHitsMonthly +=
				jsDelivrMonthData[packageName] ?? 0;
			current.variable.jsDelivrHitsTotal += jsDelivrTotalData[packageName] ?? 0;
		} else {
			current.static.npmDownloadMonthly += npmMonthData[packageName] ?? 0;
			current.static.npmDownloadTotal += npmTotalData[packageName] ?? 0;
			current.static.jsDelivrHitsMonthly += jsDelivrMonthData[packageName] ?? 0;
			current.static.jsDelivrHitsTotal += jsDelivrTotalData[packageName] ?? 0;
		}

		current.total = {
			npmDownloadMonthly:
				current.static.npmDownloadMonthly +
				(current.variable?.npmDownloadMonthly ?? 0),
			npmDownloadTotal:
				current.static.npmDownloadTotal +
				(current.variable?.npmDownloadTotal ?? 0),
			jsDelivrHitsMonthly:
				current.static.jsDelivrHitsMonthly +
				(current.variable?.jsDelivrHitsMonthly ?? 0),
			jsDelivrHitsTotal:
				current.static.jsDelivrHitsTotal +
				(current.variable?.jsDelivrHitsTotal ?? 0),
		};

		stats[id] = current;
	}

	return stats;
};

/**
 * Refreshes the upstream catalog and persists the normalized source payload.
 *
 * Derived views are rebuilt lazily by the read path, so the scheduled refresh
 * only updates the source-of-truth catalog blob.
 */
export const refreshCatalog = async (env: Env): Promise<FontCatalog> => {
	const catalog = await fetchCachedJson<FontCatalog>(
		UPSTREAM_URLS.catalog,
		KV_CACHE_TTLS.metadata,
	);
	await env.METADATA.put(KV_KEYS.catalog, JSON.stringify(catalog));

	return catalog;
};

/**
 * Refreshes the axis registry from the upstream source and stores the
 * normalized registry object in KV.
 */
export const refreshAxisRegistry = async (env: Env): Promise<AxisRegistry> => {
	const registry = buildAxisRegistry(
		await fetchCachedJson<AxisRegistryItem[]>(
			UPSTREAM_URLS.axisRegistry,
			KV_CACHE_TTLS.metadata,
		),
	);

	await env.METADATA.put(KV_KEYS.axisRegistry, JSON.stringify(registry));
	return registry;
};

/**
 * Refreshes aggregated download statistics from all upstream stats endpoints.
 */
export const refreshStats = async (env: Env): Promise<StatsRecord> => {
	const [npmMonthData, npmTotalData, jsDelivrMonthData, jsDelivrTotalData] =
		await Promise.all([
			fetchCachedJson<Record<string, number>>(
				UPSTREAM_URLS.stats.npmMonth,
				KV_CACHE_TTLS.metadata,
			),
			fetchCachedJson<Record<string, number>>(
				UPSTREAM_URLS.stats.npmTotal,
				KV_CACHE_TTLS.metadata,
			),
			fetchCachedJson<Record<string, number>>(
				UPSTREAM_URLS.stats.jsdelivrMonth,
				KV_CACHE_TTLS.metadata,
			),
			fetchCachedJson<Record<string, number>>(
				UPSTREAM_URLS.stats.jsdelivrTotal,
				KV_CACHE_TTLS.metadata,
			),
		]);

	const stats = aggregateStats(
		npmMonthData,
		npmTotalData,
		jsDelivrMonthData,
		jsDelivrTotalData,
	);

	await env.METADATA.put(KV_KEYS.stats, JSON.stringify(stats));
	return stats;
};
