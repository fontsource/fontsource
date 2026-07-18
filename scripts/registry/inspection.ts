import { createHash } from 'node:crypto';
import type { FontInspection } from '@fontsource-utils/core';
import type { FamilyInspection } from './schema.ts';
import { compareStrings } from './shared.ts';

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

const hashCoverage = (
	ranges: Array<number | readonly [number, number]>,
): { codepointCount: number; sha256: string } => {
	const codepoints = new Set<number>();
	for (const range of ranges) {
		if (typeof range === 'number') {
			codepoints.add(range);
			continue;
		}
		for (let codepoint = range[0]; codepoint <= range[1]; codepoint += 1) {
			codepoints.add(codepoint);
		}
	}
	const sorted = [...codepoints].sort((left, right) => left - right);
	const hash = createHash('sha256');
	const bytes = new Uint8Array(4);
	const view = new DataView(bytes.buffer);
	for (const codepoint of sorted) {
		view.setUint32(0, codepoint);
		hash.update(bytes);
	}
	return { codepointCount: sorted.length, sha256: hash.digest('hex') };
};

const outlineKind = (
	tables: readonly string[],
): FamilyInspection['files'][number]['outline'] => {
	if (tables.includes('glyf')) return 'glyf';
	if (tables.includes('CFF2')) return 'cff2';
	if (tables.includes('CFF ')) return 'cff';
	if (tables.some((table) => ['CBDT', 'EBDT', 'sbix'].includes(table))) {
		return 'bitmap';
	}
	throw new Error(`Unsupported font outline: ${tables.join(', ')}`);
};

export const normalizeInspection = (
	path: string,
	font: FontInspection,
): FamilyInspection['files'][number] => ({
	path,
	fontVersion: font.fontVersion,
	weight: font.weight,
	style: font.style,
	axes: font.axes,
	cmap: hashCoverage(font.unicodeRanges),
	outline: outlineKind(font.tables),
	colorTables: font.tables
		.filter((table) => COLOR_TABLES.has(table))
		.sort(compareStrings),
});
