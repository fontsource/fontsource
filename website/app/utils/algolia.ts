const ALGOLIA_CACHE_KEY_PREFIX = 'algolia:ssr:search-v3';

export const buildAlgoliaCacheKey = async (
	requestUrl: string,
): Promise<string | undefined> => {
	const url = new URL(requestUrl);
	// qs preserves malformed escapes that URLSearchParams replaces or repairs.
	try {
		decodeURIComponent(url.search);
	} catch {
		return undefined;
	}
	const source = url.searchParams;
	// qs truncates after 1,000 entries, so ignored parameters can affect routing.
	if (url.search.split('&').length > 1000) return undefined;

	const searchParams = new Set([
		'query',
		'category',
		'variable',
		'sort',
		'subsets',
		'classifications',
		'tags',
		'languages',
	]);
	if ([...source.keys()].some((key) => key.split('[')[0] === 'collection')) {
		return undefined;
	}

	const params = [...source]
		.filter(([key]) => searchParams.has(key.split('[')[0]))
		// Preserve order within a filter: qs can interpret mixed bracket/duplicate
		// entries differently when reordered. Independent filters can share a key.
		.sort(([left], [right]) => {
			const a = left.split('[')[0];
			const b = right.split('[')[0];
			return a < b ? -1 : a > b ? 1 : 0;
		});
	const digest = await crypto.subtle.digest(
		'SHA-256',
		new TextEncoder().encode(
			JSON.stringify([url.pathname, new URLSearchParams(params).toString()]),
		),
	);
	const hash = Array.from(new Uint8Array(digest), (byte) =>
		byte.toString(16).padStart(2, '0'),
	).join('');
	return `${ALGOLIA_CACHE_KEY_PREFIX}:${hash}`;
};
