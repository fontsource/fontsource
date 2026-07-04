const ALGOLIA_CACHE_KEY_PREFIX = 'algolia:ssr';

export const buildAlgoliaCacheKey = (requestUrl: string): string => {
	const source = new URL(requestUrl).searchParams;
	const params = new URLSearchParams();

	const query = source.get('query')?.trim();
	if (query) {
		params.set('query', query);
	}

	const subsets = source
		.getAll('subsets')
		.flatMap((value) => value.split(','))
		.map((value) => value.trim())
		.filter(Boolean);
	if (subsets.length) {
		params.set('subsets', [...new Set(subsets)].sort().join(','));
	}

	const category = source.get('category')?.trim();
	if (category) {
		params.set('category', category);
	}

	if (source.getAll('variable').some((value) => value.trim())) {
		params.set('variable', 'true');
	}

	const sort = source.get('sort')?.trim();
	if (sort) {
		params.set('sort', sort);
	}

	const suffix = params.toString();
	return suffix
		? `${ALGOLIA_CACHE_KEY_PREFIX}:${suffix}`
		: `${ALGOLIA_CACHE_KEY_PREFIX}:root`;
};
