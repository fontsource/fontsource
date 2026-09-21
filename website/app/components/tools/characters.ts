import type {
	FontBuildCharacters,
	FontInspection,
} from '@fontsource-utils/core';
import { subsetToLanguage } from '@/utils/language/subsets';

export interface CharacterSelection {
	mode: 'all' | 'subsets' | 'text';
	subsets: string[];
	text: string;
}

// Load only the selected definitions; large CJK sets stay out of the initial bundle.
const subsetSources = import.meta.glob<string[][]>(
	'../../../../registry/data/subsets/*.json',
	{ import: 'ranges' },
);
const subsetLoaders = new Map(
	Object.entries(subsetSources).map(([path, load]) => [
		path.split('/').pop()?.replace('.json', '') ?? '',
		load,
	]),
);

const sortedCharacterSets = [...subsetLoaders.keys()]
	.filter((value) => !value.endsWith('-web'))
	.map((value) => ({ value, label: subsetToLanguage(value) }))
	.sort((a, b) => a.label.localeCompare(b.label));

const commonSets = new Set(['latin', 'latin-ext', 'greek', 'cyrillic']);
export const characterSetOptions = [
	{
		group: 'Common sets',
		items: sortedCharacterSets.filter(({ value }) => commonSets.has(value)),
	},
	{
		group: 'More sets',
		items: sortedCharacterSets.filter(({ value }) => !commonSets.has(value)),
	},
];

export const hasCharacter = (font: FontInspection, codepoint: number) =>
	font.unicodeRanges.some((range) =>
		typeof range === 'number'
			? range === codepoint
			: codepoint >= range[0] && codepoint <= range[1],
	);

export const resolveCharacters = async (
	selection: CharacterSelection,
): Promise<{ characters: FontBuildCharacters; codepoints: number[] }> => {
	if (selection.mode === 'all') return { characters: 'all', codepoints: [] };
	const points = new Set<number>();
	if (selection.mode === 'text') {
		if (!selection.text.trim())
			throw new Error('Enter the text you want to keep.');
		for (const character of selection.text) {
			const point = character.codePointAt(0);
			if (point !== undefined && !/[\r\n\t]/u.test(character))
				points.add(point);
		}
	} else {
		if (selection.subsets.length === 0) {
			throw new Error('Choose at least one character set.');
		}
		for (const subset of selection.subsets) {
			const load = subsetLoaders.get(subset);
			if (!load) throw new Error(`Unknown character set: ${subset}`);
			const ranges = await load();
			for (const [start, end] of ranges) {
				for (
					let point = Number.parseInt(start, 16);
					point <= Number.parseInt(end, 16);
					point++
				) {
					points.add(point);
				}
			}
		}
	}
	const codepoints = [...points].sort((a, b) => a - b);
	return {
		codepoints,
		characters: {
			subsets: ['custom'],
			subsetSources: {
				custom: codepoints.map((point) => `0x${point.toString(16)}`).join('\n'),
			},
		},
	};
};
