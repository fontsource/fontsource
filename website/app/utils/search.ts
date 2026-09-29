const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

const searchQueryEncoder = new TextEncoder();

const normalizeSearchQuery = (value: unknown): string => {
	if (typeof value !== 'string') return '';

	const { read } = searchQueryEncoder.encodeInto(value, new Uint8Array(512));
	return value.slice(0, read);
};

export { normalizeSearchQuery, normalizeSearchValue };
