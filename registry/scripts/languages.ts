import type { FontInspection } from '@fontsource-utils/core';
import type { LanguageCatalog } from './schema.ts';
import { compareStrings } from './shared.ts';

export type FontCoverage = FontInspection['unicodeRanges'];

const supportsCodepoint = (
	ranges: FontInspection['unicodeRanges'],
	codepoint: number,
): boolean =>
	ranges.some((range) =>
		typeof range === 'number'
			? range === codepoint
			: range[0] <= codepoint && codepoint <= range[1],
	);

export const createLanguageMatcher = (catalog: LanguageCatalog) => {
	const requirements = Object.entries(catalog).flatMap(([id, language]) =>
		language.requiredCodepoints
			? ([[id, language.requiredCodepoints]] as const)
			: [],
	);
	const cache = new Map<string, ReadonlySet<string>>();

	return (faces: readonly FontCoverage[]): string[] => {
		let familyLanguages: Set<string> | undefined;
		for (const coverage of faces) {
			const key = JSON.stringify(coverage);
			let faceLanguages = cache.get(key);
			if (!faceLanguages) {
				faceLanguages = new Set(
					requirements
						.filter(([, codepoints]) =>
							codepoints.every((codepoint) =>
								supportsCodepoint(coverage, codepoint),
							),
						)
						.map(([id]) => id),
				);
				cache.set(key, faceLanguages);
			}

			if (!familyLanguages) {
				familyLanguages = new Set(faceLanguages);
				continue;
			}
			for (const language of familyLanguages) {
				if (!faceLanguages.has(language)) familyLanguages.delete(language);
			}
		}
		return [...(familyLanguages ?? [])].toSorted(compareStrings);
	};
};
