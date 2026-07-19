const ALGOLIA_CACHE_KEY_PREFIX = 'algolia:ssr';

export const buildAlgoliaCacheKey = (
	requestUrl: string,
): string | undefined => {
	const url = new URL(requestUrl);
	const source = url.searchParams;

	if (
		['query', 'category', 'variable', 'sort'].some((param) =>
			source.getAll(param).some((value) => value.trim()),
		) ||
		source
			.getAll('subsets')
			.some((value) => value.split(',').some((subset) => subset.trim()))
	) {
		return undefined;
	}

	const pathname = url.pathname.replace(/^\/+|\/+$/g, '');
	const scope = pathname ? pathname.replaceAll('/', ':') : 'root';
	return `${ALGOLIA_CACHE_KEY_PREFIX}:${scope}`;
};
