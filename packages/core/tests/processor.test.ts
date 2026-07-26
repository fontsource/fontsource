import { describe, expect, it } from 'vitest';
import { createFontContext } from '../src/context';
import { inspectFont } from '../src/inspection';
import { buildFont } from '../src/processor';
import type { FontBuildConfig, FontBuildResult } from '../src/types';
import {
	loadStaticFontFixture,
	loadStaticWoff2Fixture,
	loadVariableFontFixture,
} from './font-fixture';

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
	buffer: Uint8Array | Uint8Array[],
	config: FontBuildConfig,
	options?: Parameters<typeof buildFont>[3],
): Promise<FontBuildResult> => {
	const ctx = createFontContext();

	try {
		return await buildFont(
			ctx,
			Array.isArray(buffer) ? buffer : [buffer],
			config,
			options,
		);
	} finally {
		ctx.destroy();
	}
};

const changeFontRevision = (font: Uint8Array): Uint8Array => {
	const changed = font.slice();
	const view = new DataView(
		changed.buffer,
		changed.byteOffset,
		changed.byteLength,
	);
	const tableCount = view.getUint16(4, false);

	for (let index = 0; index < tableCount; index++) {
		const recordOffset = 12 + index * 16;
		const tag = String.fromCharCode(
			changed[recordOffset] ?? 0,
			changed[recordOffset + 1] ?? 0,
			changed[recordOffset + 2] ?? 0,
			changed[recordOffset + 3] ?? 0,
		);
		if (tag !== 'head') continue;

		const tableOffset = view.getUint32(recordOffset + 8, false);
		const revisionOffset = tableOffset + 4;
		view.setUint32(
			revisionOffset,
			view.getUint32(revisionOffset, false) + 1,
			false,
		);
		return changed;
	}

	throw new Error('Font fixture does not contain a head table');
};

describe('buildFont integration with real fixtures', () => {
	it('rebuilds compressed input without removing characters and applies CSS options', async () => {
		const progress: number[] = [];
		const result = await buildWithFixture(
			loadStaticWoff2Fixture(),
			{
				type: 'static',
				family: 'Abel',
				characters: 'all',
				formats: ['woff2', 'woff'],
			},
			{
				css: {
					display: 'block',
					resolver: ({ source }) => `/fonts/${source.filename}`,
				},
				onProgress: (value) => progress.push(value),
			},
		);

		expect(result.fonts).toHaveLength(2);
		expect(result.faces).toEqual([
			expect.objectContaining({
				subset: 'full',
				unicodeRange: '',
			}),
		]);
		const indexCSS = result.css.find((asset) => asset.filename === 'index.css');
		expect(indexCSS?.content).toContain('font-display: block');
		expect(indexCSS?.content).toContain(
			'url(/fonts/abel-full-400-normal.woff2)',
		);
		expect(progress.length).toBeGreaterThan(0);
	});

	it('emits one full variable font when all axes are preserved', async () => {
		const result = await buildWithFixture(loadVariableFontFixture(), {
			type: 'variable',
			id: 'recursive',
			family: 'Recursive',
			characters: 'all',
			formats: ['woff2'],
		});

		expect(result.fonts.map((font) => font.filename)).toEqual([
			'files/recursive-full-full-normal.woff2',
		]);
		expect(result.faces.map((face) => face.axisKey)).toEqual(['full']);
		expect(result.faces[0]?.weight).toBe('300 1000');
	});

	it('pins unused variable axes when building static faces', async () => {
		const result = await buildWithFixture(loadVariableFontFixture(), {
			type: 'static',
			id: 'recursive',
			family: 'Recursive',
			subsets: ['latin'],
			weights: [400, 700],
			styles: ['normal'],
			formats: ['woff2'],
			featureSettings: {},
			subsetSources: {
				latin: latinRangeSubset,
			},
		});
		const ctx = createFontContext();

		try {
			const inspections = await Promise.all(
				result.fonts.map((font) => inspectFont(ctx, font.content)),
			);

			expect(
				inspections.map(({ weight, style, axes }) => ({
					weight,
					style,
					axes,
				})),
			).toEqual([
				{ weight: 400, style: 'normal', axes: [] },
				{ weight: 700, style: 'normal', axes: [] },
			]);
		} finally {
			ctx.destroy();
		}
	});

	it('instances a slant axis for requested static styles', async () => {
		const result = await buildWithFixture(loadVariableFontFixture(), {
			type: 'static',
			id: 'recursive',
			family: 'Recursive',
			subsets: ['latin'],
			weights: [400],
			styles: ['normal', 'italic'],
			formats: ['woff2'],
			featureSettings: {},
			subsetSources: {
				latin: latinRangeSubset,
			},
		});
		const ctx = createFontContext();

		try {
			const inspections = await Promise.all(
				result.fonts.map((font) => inspectFont(ctx, font.content)),
			);

			expect(result.fonts.map((font) => font.filename)).toEqual([
				'files/recursive-latin-400-normal.woff2',
				'files/recursive-latin-400-italic.woff2',
			]);
			expect(inspections.map(({ style, axes }) => ({ style, axes }))).toEqual([
				{ style: 'normal', axes: [] },
				{ style: 'oblique', axes: [] },
			]);
		} finally {
			ctx.destroy();
		}
	});

	it('does not synthesize styles missing from the source faces', async () => {
		const result = await buildWithFixture(loadStaticFontFixture(), {
			type: 'static',
			family: 'Abel',
			subsets: ['latin'],
			weights: [400],
			styles: ['normal', 'italic'],
			formats: ['woff2'],
			featureSettings: {},
			subsetSources: {
				latin: latinRangeSubset,
			},
		});

		expect(result.fonts.map((font) => font.filename)).toEqual([
			'files/abel-latin-400-normal.woff2',
		]);
	});

	it('deduplicates colliding outputs from equivalent source faces', async () => {
		const fixture = loadStaticFontFixture();
		const result = await buildWithFixture([fixture, fixture], {
			type: 'static',
			family: 'Abel',
			characters: 'all',
			formats: ['woff2'],
		});

		expect(result.fonts).toHaveLength(1);
		expect(result.faces).toHaveLength(1);
		expect(result.faces[0]?.sources).toHaveLength(1);
	});

	it('rejects distinct source faces that would overwrite the same output', async () => {
		const fixture = loadStaticFontFixture();

		await expect(
			buildWithFixture([fixture, changeFontRevision(fixture)], {
				type: 'static',
				family: 'Abel',
				characters: 'all',
				formats: ['woff2'],
			}),
		).rejects.toThrow('Multiple distinct fonts would be written');
	});

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
