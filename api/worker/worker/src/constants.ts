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

export const CACHE_POLICIES = {
	metadata: {
		'Cache-Control': 'public, max-age=300',
		'CDN-Cache-Control': 'public, max-age=86400',
		'Cloudflare-CDN-Cache-Control':
			'public, max-age=10800, stale-while-revalidate=86400, stale-if-error=86400',
	},
	floating: {
		'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
		'CDN-Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
		'Cloudflare-CDN-Cache-Control':
			'public, max-age=900, stale-if-error=604800',
	},
	immutable: {
		'Cache-Control': IMMUTABLE_ASSET_CACHE_CONTROL,
		'CDN-Cache-Control': IMMUTABLE_ASSET_CACHE_CONTROL,
		'Cloudflare-CDN-Cache-Control': IMMUTABLE_ASSET_CACHE_CONTROL,
	},
	redirect: {
		'Cache-Control': 'public, max-age=3600',
		'CDN-Cache-Control': 'public, max-age=3600',
		'Cloudflare-CDN-Cache-Control': 'public, max-age=3600',
	},
	notFound: {
		'Cache-Control': 'public, max-age=60',
		'CDN-Cache-Control': 'public, max-age=60',
		'Cloudflare-CDN-Cache-Control': 'public, max-age=60',
	},
	noStore: {
		'Cache-Control': 'no-store',
		'CDN-Cache-Control': 'no-store',
		'Cloudflare-CDN-Cache-Control': 'no-store',
	},
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
