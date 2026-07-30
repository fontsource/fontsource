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
	weight: font.weight,
	style: font.style,
	axes: font.axes,
	outline: outlineKind(font.tables),
	colorTables: font.tables
		.filter((table) => COLOR_TABLES.has(table))
		.toSorted(),
});
