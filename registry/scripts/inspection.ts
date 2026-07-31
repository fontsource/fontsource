import type { FontInspection } from '@fontsource-utils/core';
import type { FamilySource } from './schema.ts';

const COLOR_TABLES = new Set([
	'CBDT',
	'CBLC',
	'COLR',
	'CPAL',
	'EBDT',
	'EBLC',
	'SVG ',
	'sbix',
]);
const BITMAP_TABLES = new Set(['CBDT', 'EBDT', 'sbix']);

const codepointHex = (value: number): string =>
	value.toString(16).toUpperCase().padStart(4, '0');

const outlineKind = (
	tables: readonly string[],
): FamilySource['inspection']['outline'] => {
	if (tables.includes('glyf')) return 'glyf';
	if (tables.includes('CFF2')) return 'cff2';
	if (tables.includes('CFF ')) return 'cff';
	if (tables.some((table) => BITMAP_TABLES.has(table))) {
		return 'bitmap';
	}
	throw new Error(`Unsupported font outline: ${tables.join(', ')}`);
};

export const normalizeInspection = (
	font: FontInspection,
): FamilySource['inspection'] => ({
	fontVersion: font.fontVersion,
	glyphs: font.glyphs,
	weight: font.weight,
	style: font.style,
	axes: font.axes,
	codepoints: font.unicodeRanges.reduce<number>(
		(count, range) =>
			count + (typeof range === 'number' ? 1 : range[1] - range[0] + 1),
		0,
	),
	unicodeRange: font.unicodeRanges
		.map((range) => {
			const [start, end] = typeof range === 'number' ? [range, range] : range;
			return start === end
				? `U+${codepointHex(start)}`
				: `U+${codepointHex(start)}-${codepointHex(end)}`;
		})
		.join(', '),
	features: font.features,
	outline: outlineKind(font.tables),
	colorTables: font.tables
		.filter((table) => COLOR_TABLES.has(table))
		.toSorted(),
});
