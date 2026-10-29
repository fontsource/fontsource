import { HTTPException } from 'hono/http-exception';
import {
	type AxisRegistry,
	type AxisRegistryItem,
	buildAxisRegistry,
} from '../../../../shared/axis-registry';
import type { FontCatalog } from '../../../../shared/catalog';
import {
	type PublishedPackages,
	PublishedPackagesSchema,
} from '../../../../shared/published-packages';
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

/** Validate a complete publication projection before replacing the last good copy. */
export const refreshPublishedPackages = async (
	env: Env,
): Promise<PublishedPackages> => {
	const parsed = PublishedPackagesSchema.safeParse(
		await fetchCachedJson<unknown>(
			UPSTREAM_URLS.publishedPackages,
			KV_CACHE_TTLS.metadata,
		),
	);
	if (!parsed.success)
		throw new HTTPException(502, {
			message: 'Bad Gateway. Invalid publication index.',
		});
	await env.METADATA.put(
		KV_KEYS.publishedPackages,
		JSON.stringify(parsed.data),
	);
	return parsed.data;
};
