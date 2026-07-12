export const PUBLIC_ORIGIN = 'https://fontsource.org';

export const cacheHeaders = {
	document: {
		'Cache-Control': 'public, max-age=0',
		'Cloudflare-CDN-Cache-Control':
			'public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400',
	},
	short: {
		'Cache-Control':
			'public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400',
	},
	stable: {
		'Cache-Control':
			'public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800',
	},
	noStore: {
		'Cache-Control': 'no-store',
		'CDN-Cache-Control': 'no-store',
		'Cloudflare-CDN-Cache-Control': 'no-store',
	},
} as const;
