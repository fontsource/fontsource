const normalizeSearchValue = (value: string) =>
	value.trim().toLowerCase().replace(/[_-]+/g, ' ');

export { normalizeSearchValue };
