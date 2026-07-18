import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codepointsToRanges, parseNam, parseSlices } from './nam.ts';

const fixture = (directory: string, filename: string): Promise<string> =>
	readFile(
		resolve(
			import.meta.dirname,
			'../../packages/core/tests/fixtures',
			directory,
			filename,
		),
		'utf8',
	);

describe('NAM normalization', () => {
	it('normalizes machine-readable NAM files into minimal ranges', async () => {
		const codepoints = parseNam(
			await fixture('nam-files', 'latin_unique-glyphs.nam'),
		);
		const ranges = codepointsToRanges(codepoints);

		expect(codepoints.length).toBeGreaterThan(100);
		expect(ranges[0]).toEqual(['0', '0']);
		expect(ranges.length).toBeLessThan(codepoints.length);
	});

	it('keeps Google slice priority and rejects invalid Unicode scalars', async () => {
		const slices = parseSlices(await fixture('slices', 'japanese_default.txt'));
		expect(slices).toHaveLength(120);
		expect(slices[0]?.length).toBeGreaterThan(0);
		expect(() => parseNam('0xD800 SURROGATE')).toThrow(
			'Invalid Unicode scalar',
		);
	});
});
