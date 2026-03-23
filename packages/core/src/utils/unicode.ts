import { formatUnicodeRanges } from '@glypht/bundler-utils';

/** Convert codepoints into a CSS `unicode-range` string. */
export const codepointsToRangeString = (
	codepoints: number[] | undefined,
): string => {
	if (!codepoints || codepoints.length === 0) {
		return '';
	}

	const sorted = Array.from(new Set(codepoints)).sort((a, b) => a - b);
	const ranges: (number | [number, number])[] = [];

	let rangeStart = sorted[0] as number;
	for (let i = 1; i <= sorted.length; i++) {
		const current = sorted[i];
		const prev = sorted[i - 1] as number;

		if (current !== prev + 1) {
			if (rangeStart === prev) {
				ranges.push(rangeStart);
			} else {
				ranges.push([rangeStart, prev]);
			}
			rangeStart = current as number;
		}
	}

	return formatUnicodeRanges(ranges).join(', ').toUpperCase();
};
