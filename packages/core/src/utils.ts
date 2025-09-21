/**
 * Normalizes a string to kebab-case.
 */
export const normalizeKebabCase = (text: string): string => {
	return text.toLowerCase().replace(/\s+/g, '-');
};

/**
 * Converts a sorted array of codepoints into an efficient CSS unicode-range string.
 */
export const codepointsToRangeString = (
	codepoints: number[] | undefined,
): string => {
	if (!codepoints || codepoints.length === 0) return '';

	const sorted = [...new Set(codepoints)].sort((a, b) => a - b);
	const ranges: string[] = [];
	let rangeStart = sorted[0];

	for (let i = 1; i < sorted.length; i++) {
		if (sorted[i] !== sorted[i - 1] + 1) {
			const rangeEnd = sorted[i - 1];
			if (rangeStart === rangeEnd) {
				ranges.push(`U+${rangeStart.toString(16).toUpperCase()}`);
			} else {
				ranges.push(
					`U+${rangeStart.toString(16).toUpperCase()}-${rangeEnd.toString(16).toUpperCase()}`,
				);
			}
			rangeStart = sorted[i];
		}
	}

	const lastCodepoint = sorted[sorted.length - 1];
	if (rangeStart === lastCodepoint) {
		ranges.push(`U+${rangeStart.toString(16).toUpperCase()}`);
	} else {
		ranges.push(
			`U+${rangeStart.toString(16).toUpperCase()}-${lastCodepoint.toString(16).toUpperCase()}`,
		);
	}

	return ranges.join(', ');
};

/**
 * Extracts a numeric value from a font style value that could be either a number or an object.
 */
export const extractStyleValue = (
	value: number | { min: number; defaultValue: number; max: number },
): number => {
	return typeof value === 'number' ? value : value.defaultValue;
};
