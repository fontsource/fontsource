const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const MAX_SEARCH_QUERY_LENGTH = 128;

const normalizeSearchQuery = (value: unknown): string => {
	if (typeof value !== 'string') return '';

	// Do not leave half of a surrogate pair at the truncation boundary.
	return value
		.slice(0, MAX_SEARCH_QUERY_LENGTH)
		.replace(/[\uD800-\uDBFF]$/u, '');
};

export { MAX_SEARCH_QUERY_LENGTH, normalizeSearchQuery, normalizeSearchValue };
