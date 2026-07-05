const ALGOLIA_CACHE_KEY_PREFIX = 'algolia:ssr';

export const buildAlgoliaCacheKey = (
	requestUrl: string,
): string | undefined => {
	const source = new URL(requestUrl).searchParams;

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

	return `${ALGOLIA_CACHE_KEY_PREFIX}:root`;
};
