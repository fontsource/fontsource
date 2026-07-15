import {
	type AxisRegistry,
	type AxisRegistryItem,
	buildAxisRegistry,
} from '../../../../shared/axis-registry';
import type { FontCatalog } from '../../../../shared/catalog';
import { fetchCachedJson } from '../../../../shared/upstream';
import { KV_CACHE_TTLS, KV_KEYS, UPSTREAM_URLS } from '../../constants';

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
