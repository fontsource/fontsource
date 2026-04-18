import {
	BINARY_CONTENT_TYPES,
	IMMUTABLE_ASSET_CACHE_CONTROL,
} from '../../shared/http-metadata';

export const KV_KEYS = {
	catalog: 'catalog',
	axisRegistry: 'axis_registry',
	stats: 'download_stats',
} as const;

export { UPSTREAM_URLS } from '../../shared/upstream';

/**
 * Cache policy for the public API and CDN routes.
 */
export const CACHE_HEADERS = {
	api: 'public, max-age=300, stale-while-revalidate=3600',
	floatingAsset: 'public, max-age=300, stale-while-revalidate=86400',
	immutableAsset: IMMUTABLE_ASSET_CACHE_CONTROL,
	redirect: 'public, max-age=3600',
} as const;

export const KV_CACHE_TTLS = {
	metadata: 3600,
	versions: 900,
} as const;

export const DERIVED_METADATA_CACHE_TTL_MS = 5 * 60 * 1000;

export const CONTENT_TYPES: Record<string, string> = {
	css: 'text/css; charset=utf-8',
	json: 'application/json; charset=utf-8',
	...BINARY_CONTENT_TYPES,
};
