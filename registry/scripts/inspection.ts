import { createHash } from 'node:crypto';
import type { FontInspection } from '@fontsource-utils/core';
import type { FamilySource } from './schema.ts';
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
const BITMAP_TABLES = new Set(['CBDT', 'EBDT', 'sbix']);

type NormalizedInspection = {
	inspection: FamilySource['inspection'];
	cmap: { codepointCount: number; sha256: string };
};

const hashCoverage = (
	ranges: FontInspection['unicodeRanges'],
): NormalizedInspection['cmap'] => {
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
	const sorted = Array.from(codepoints).toSorted((left, right) => left - right);
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
): NormalizedInspection => ({
	cmap: hashCoverage(font.unicodeRanges),
	inspection: {
		fontVersion: font.fontVersion,
		weight: font.weight,
		style: font.style,
		axes: font.axes,
		outline: outlineKind(font.tables),
		colorTables: font.tables
			.filter((table) => COLOR_TABLES.has(table))
			.toSorted(compareStrings),
	},
});
