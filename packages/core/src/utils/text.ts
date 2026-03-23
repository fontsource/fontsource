export const normalizeKebabCase = (text: string): string =>
	text.toLowerCase().replace(/\s+/g, '-');
