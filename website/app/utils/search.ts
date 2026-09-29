const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const searchQueryEncoder = new TextEncoder();

const normalizeSearchQuery = (value: unknown): string => {
	if (typeof value !== 'string') return '';

	let query = '';
	let bytes = 0;
	for (const character of value) {
		bytes += searchQueryEncoder.encode(character).length;
		if (bytes > 512) break;
		query += character;
	}

	return query;
};

export { normalizeSearchQuery, normalizeSearchValue };
