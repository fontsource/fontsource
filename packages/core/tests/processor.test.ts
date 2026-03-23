import { describe, expect, it } from 'vitest';
import { createFontContext } from '../src/context';
import { buildFont } from '../src/processor';
import type { FontBuildConfig, FontBuildResult } from '../src/types';
import { loadStaticFontFixture, loadVariableFontFixture } from './font-fixture';

const latinRangeSubset = '0x0020\n0x0021\n0x0022';
const latinSlicingSubset = `subsets {
  codepoints: 65
}
subsets {
  codepoints: 66
}`;

const serialisePackage = (result: FontBuildResult) => ({
	css: result.css,
	faces: result.faces,
	fonts: result.fonts.map((font) => ({
		filename: font.filename,
		format: font.format,
		size: font.content.length,
	})),
});

const buildWithFixture = async (
	buffer: Uint8Array,
	config: FontBuildConfig,
): Promise<FontBuildResult> => {
	const ctx = createFontContext();

	try {
		return await buildFont(ctx, [buffer], config);
	} finally {
		ctx.destroy();
	}
};

describe('buildFont integration with real fixtures', () => {
	it('infers static metadata and groups multiple output formats into one face', async () => {
		const result = await buildWithFixture(loadStaticFontFixture(), {
			type: 'static',
			family: 'Abel',
			subsets: ['latin'],
			weights: [],
			styles: [],
			formats: ['woff2', 'woff'],
			featureSettings: {},
			subsetSources: {
				latin: latinRangeSubset,
			},
		});

		expect(result.faces).toHaveLength(1);
		expect(result.faces[0]?.sources).toHaveLength(2);
		expect(result.css.map((asset) => asset.filename)).toEqual([
			'400.css',
			'latin.css',
			'index.css',
		]);
		expect(serialisePackage(result)).toMatchSnapshot();
	});

	it('preserves sliced static subsets as separate faces', async () => {
		const result = await buildWithFixture(loadStaticFontFixture(), {
			type: 'static',
			family: 'Abel',
			subsets: ['latin'],
			weights: [],
			styles: [],
			formats: ['woff2', 'woff'],
			featureSettings: {},
			subsetSources: {
				latin: latinSlicingSubset,
			},
		});

		expect(result.faces.map((face) => face.sliceIndex)).toEqual([1, 2]);
		expect(result.faces.every((face) => face.sources.length === 2)).toBe(true);
		expect(serialisePackage(result)).toMatchSnapshot();
	});

	it('builds variable slices for real standard-axis data', async () => {
		const result = await buildWithFixture(loadVariableFontFixture(), {
			type: 'variable',
			id: 'recursive',
			family: 'Recursive',
			subsets: ['latin'],
			weights: [],
			styles: ['normal'],
			formats: ['woff2'],
			featureSettings: {},
			variable: {
				wght: { min: 300, max: 1000 },
				slnt: { min: -15, max: 0 },
			},
			subsetSources: {
				latin: latinSlicingSubset,
			},
		});

		expect(new Set(result.faces.map((face) => face.axisKey))).toEqual(
			new Set(['wght', 'slnt', 'standard']),
		);
		expect(result.faces.map((face) => face.sliceIndex)).toEqual([
			1, 2, 1, 2, 1, 2,
		]);
		expect(serialisePackage(result)).toMatchSnapshot();
	});

	it('emits every published axis key when custom axes are enabled', async () => {
		const result = await buildWithFixture(loadVariableFontFixture(), {
			type: 'variable',
			id: 'recursive',
			family: 'Recursive',
			subsets: ['latin'],
			weights: [],
			styles: ['normal'],
			formats: ['woff2'],
			featureSettings: {},
			variable: {
				wght: { min: 300, max: 1000 },
				slnt: { min: -15, max: 0 },
				CASL: { min: 0, max: 1 },
			},
			subsetSources: {
				latin: latinRangeSubset,
			},
		});

		expect(new Set(result.faces.map((face) => face.axisKey))).toEqual(
			new Set(['wght', 'slnt', 'CASL', 'standard', 'full']),
		);
		expect(result.fonts.map((font) => font.filename)).toEqual(
			expect.arrayContaining([
				'files/recursive-latin-wght-normal.woff2',
				'files/recursive-latin-slnt-normal.woff2',
				'files/recursive-latin-casl-normal.woff2',
				'files/recursive-latin-standard-normal.woff2',
				'files/recursive-latin-full-normal.woff2',
			]),
		);
		expect(serialisePackage(result)).toMatchSnapshot();
	});

	it('can emit multiple variable axis keys in one build', async () => {
		const result = await buildWithFixture(loadVariableFontFixture(), {
			type: 'variable',
			id: 'recursive',
			family: 'Recursive',
			subsets: ['latin'],
			weights: [],
			styles: ['normal'],
			formats: ['woff2'],
			featureSettings: {},
			axisKeys: ['MONO', 'standard', 'full'],
			variable: {
				MONO: { min: 0, max: 1 },
				wght: { min: 300, max: 1000 },
				slnt: { min: -15, max: 0 },
			},
			subsetSources: {
				latin: latinRangeSubset,
			},
		});

		expect(result.faces.map((face) => face.axisKey)).toEqual([
			'MONO',
			'standard',
			'full',
		]);
		expect(result.fonts.map((font) => font.filename)).toEqual([
			'files/recursive-latin-mono-normal.woff2',
			'files/recursive-latin-standard-normal.woff2',
			'files/recursive-latin-full-normal.woff2',
		]);
		expect(result.css.map((asset) => asset.filename)).toEqual(
			expect.arrayContaining([
				'MONO.css',
				'standard-italic.css',
				'full-italic.css',
				'index.css',
			]),
		);
	});
});
