const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const MAX_SEARCH_QUERY_LENGTH = 128;

export { MAX_SEARCH_QUERY_LENGTH, normalizeSearchValue };
