const ALGOLIA_CACHE_KEY_PREFIX = 'algolia:ssr:taxonomy-v2';

export const buildAlgoliaCacheKey = (
	requestUrl: string,
): string | undefined => {
	const url = new URL(requestUrl);
	const source = url.searchParams;

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
	// qs also accepts bracket arrays such as languages[0]=ja_Jpan.
	if (
		[...source].some(
			([key, value]) =>
				searchParams.has(key.split('[')[0]) &&
				value.split(',').some((item) => item.trim()),
		)
	) {
		return undefined;
	}

	const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
	const scope = pathname ? pathname.replaceAll('/', ':') : 'root';
	return `${ALGOLIA_CACHE_KEY_PREFIX}:${scope}`;
};
