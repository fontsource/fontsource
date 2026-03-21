import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	generateCSS,
	generateCSSFromFaces,
	generateFontFace,
} from '../src/css';
import type { FontFace, FontFormat, FontSource } from '../src/types';

const snapshotDir = resolve(
	fileURLToPath(import.meta.url),
	'../__snapshots__/css',
);

type FaceOverrides = Partial<Omit<FontFace, 'sources'>> & {
	filename?: string;
	format?: FontFormat;
	sources?: FontSource[];
};

const resolveSources = ({
	sources,
	filename = '',
	format = 'woff2',
}: Pick<FaceOverrides, 'sources' | 'filename' | 'format'>): FontSource[] =>
	sources ?? [{ format, filename }];

const staticFace = (
	overrides: FaceOverrides & { subset: string; weight: number },
): FontFace => {
	const { sources, filename, format, ...face } = overrides;
	return {
		style: 'normal',
		isVariable: false,
		unicodeRange: '',
		sources: resolveSources({ sources, filename, format }),
		sliceIndex: 0,
		...face,
	};
};

const variableFace = (
	overrides: FaceOverrides & { subset: string },
): FontFace => {
	const { sources, filename, format, ...face } = overrides;
	return {
		weight: '100 900',
		style: 'normal',
		isVariable: true,
		unicodeRange: '',
		sources: resolveSources({ sources, filename, format }),
		axisKey: 'wght',
		stretch: null,
		sliceIndex: 0,
		...face,
	};
};

/**
 * Serialises a CSSAsset[] into a single string that is easy to snapshot.
 * Each file is separated by a header line so diffs are readable.
 */
const serialiseAssets = (
	assets: { filename: string; content: string }[],
): string => assets.map((a) => `/* ${a.filename} */\n${a.content}`).join('\n');

describe('generateFontFace', () => {
	it('static font-face', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 400,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static.css'),
		);
	});

	it('static bold font-face', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 700,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-700-normal.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-bold.css'),
		);
	});

	it('static italic font-face', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 400,
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-italic.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-italic.css'),
		);
	});

	it('static oblique with decimal degrees', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin-ext',
				weight: 700,
				style: 'oblique 12.5deg',
				unicodeRange: 'U+0100-024F',
				filename: 'inter-latin-ext-700-italic.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-oblique-decimal.css'),
		);
	});

	it('static oblique with integer degrees', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin-ext',
				weight: 700,
				style: 'oblique 10deg',
				unicodeRange: 'U+0100-024F',
				filename: 'inter-latin-ext-700-italic.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-oblique-integer.css'),
		);
	});

	it('variable font-face with wght axis', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-normal.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-wght.css'),
		);
	});

	it('variable font-face with width stretch', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				weight: '400',
				axisKey: 'wdth',
				stretch: '75% 125%',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-wdth-normal.woff2',
			}),
			'TestFont',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-stretch.css'),
		);
	});

	it('variable font-face with fixed width value', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				weight: '400',
				axisKey: 'wdth',
				stretch: '100%',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-wdth-normal.woff2',
			}),
			'TestFont',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-fixed-width.css'),
		);
	});

	it('variable font-face with slant axis and oblique style', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				weight: '400 700',
				style: 'oblique 0deg 15deg',
				axisKey: 'standard',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-standard-italic.woff2',
			}),
			'TestFont',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-slant.css'),
		);
	});

	it('sliced subset with slice index', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'japanese',
				weight: '300 800',
				unicodeRange: 'U+3041-3042',
				filename: 'inter-japanese-variable-1.woff2',
				sliceIndex: 1,
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-sliced.css'),
		);
	});

	it('resolver overrides url', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 400,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.woff2',
			}),
			'Inter',
			{
				resolver: ({ source }) =>
					`https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/${source.filename}`,
			},
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-resolver.css'),
		);
	});

	it('custom display value', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 400,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.woff2',
			}),
			'Inter',
			{ display: 'block' },
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-display-block.css'),
		);
	});

	it('omits unicode-range when empty', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 400,
				filename: 'inter-latin-400-normal.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-no-unicode-range.css'),
		);
	});

	it('does not double-append Variable to family name', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-normal.woff2',
			}),
			'Inter Variable',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-already-named.css'),
		);
	});

	it('woff format detection', async () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 400,
				format: 'woff',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.woff',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-woff.css'),
		);
	});

	it('ttf format detection', () => {
		const css = generateFontFace(
			staticFace({
				subset: 'latin',
				weight: 400,
				format: 'ttf',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.ttf',
			}),
			'Inter',
		);

		expect(css).toContain("format('truetype')");
	});

	it('variable font-face with fixed slant value', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				weight: '300 600',
				style: 'oblique 12deg',
				axisKey: 'standard',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-standard-italic.woff2',
			}),
			'TestFont',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-fixed-slant.css'),
		);
	});

	it('variable font-face with slant axis only', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				weight: '400',
				style: 'oblique 10deg 10deg',
				axisKey: 'slnt',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-slnt-italic.woff2',
			}),
			'TestFont',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-slant-only.css'),
		);
	});

	it('variable font-face with no recognized axis', async () => {
		const css = generateFontFace(
			variableFace({
				subset: 'latin',
				weight: '100 900',
				axisKey: 'none',
				unicodeRange: 'U+0000-00FF',
				filename: 'no-axis.woff2',
			}),
			'Inter',
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-no-axis.css'),
		);
	});

	it('throws when no backing source is provided', () => {
		expect(() =>
			generateFontFace(
				{
					subset: 'latin',
					weight: 400,
					style: 'normal',
					isVariable: false,
					unicodeRange: '',
					sources: [],
					sliceIndex: 0,
				},
				'Inter',
			),
		).toThrow('generateFontFace requires at least one source');
	});
});

// ---------------------------------------------------------------------------
// generateCSSFromFaces — grouped file output snapshots
// ---------------------------------------------------------------------------

describe('generateCSSFromFaces', () => {
	it('static: two subsets, two weights, two styles', async () => {
		const variants: FontFace[] = ['latin', 'latin-ext'].flatMap((subset) => {
			const ur = subset === 'latin' ? 'U+0000-00FF' : 'U+0100-024F';
			return [400, 700].flatMap((weight) =>
				(['normal', 'italic'] as const).map((style) =>
					staticFace({
						subset,
						weight,
						style,
						unicodeRange: ur,
						filename: `inter-${subset}-${weight}-${style}.woff2`,
					}),
				),
			);
		});

		const assets = generateCSSFromFaces('Inter', variants);

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-full.css'),
		);
	});

	it('returns no assets when no faces are provided', () => {
		expect(generateCSSFromFaces('Inter', [])).toEqual([]);
	});

	it('static: asymmetric variants (400+400i+700, no 700i)', async () => {
		const variants: FontFace[] = [
			staticFace({
				subset: 'latin',
				weight: 400,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.woff2',
			}),
			staticFace({
				subset: 'latin',
				weight: 400,
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-italic.woff2',
			}),
			staticFace({
				subset: 'latin',
				weight: 700,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-700-normal.woff2',
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants);
		const filenames = assets.map((a) => a.filename);

		// The key structural assertion — no phantom 700-italic
		expect(filenames).not.toContain('700-italic.css');

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-asymmetric.css'),
		);
	});

	it('static: italic-only font falls back for index.css', async () => {
		const variants: FontFace[] = [
			staticFace({
				subset: 'latin',
				weight: 400,
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-italic.woff2',
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants);
		const filenames = assets.map((a) => a.filename);

		expect(filenames).toContain('index.css');
		expect(filenames).not.toContain('400.css');

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-italic-only.css'),
		);
	});

	it('static: index.css prefers the closest normal face over italic fallback', () => {
		const variants: FontFace[] = [
			staticFace({
				subset: 'latin',
				weight: 400,
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-italic.woff2',
			}),
			staticFace({
				subset: 'latin',
				weight: 700,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-700-normal.woff2',
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants);
		const indexCss = assets.find(
			(asset) => asset.filename === 'index.css',
		)?.content;
		const normalCss = assets.find(
			(asset) => asset.filename === '700.css',
		)?.content;
		const italicCss = assets.find(
			(asset) => asset.filename === '400-italic.css',
		)?.content;

		expect(indexCss).toBe(normalCss);
		expect(indexCss).not.toBe(italicCss);
	});

	it('variable: wght axis, normal + italic', async () => {
		const variants: FontFace[] = [
			variableFace({
				subset: 'latin',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-normal.woff2',
			}),
			variableFace({
				subset: 'latin',
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-italic.woff2',
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants, {
			variable: { wght: { min: 100, max: 900 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-wght.css'),
		);
	});

	it('variable: italic-only font falls back for index.css', () => {
		const variants: FontFace[] = [
			variableFace({
				subset: 'latin',
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-italic.woff2',
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants, {
			variable: { wght: { min: 100, max: 900 } },
		});

		expect(assets.map((asset) => asset.filename)).toContain('index.css');
		expect(
			assets.find((asset) => asset.filename === 'index.css')?.content,
		).toBe(
			assets.find((asset) => asset.filename === 'wght-italic.css')?.content,
		);
	});

	it('variable: sliced subsets with multiple indices', async () => {
		const variants: FontFace[] = [
			variableFace({
				subset: 'japanese',
				weight: '300 800',
				unicodeRange: 'U+3041-3042',
				filename: 'inter-japanese-wght-normal-1.woff2',
				sliceIndex: 1,
			}),
			variableFace({
				subset: 'japanese',
				weight: '300 800',
				unicodeRange: 'U+3044-3045',
				filename: 'inter-japanese-wght-normal-2.woff2',
				sliceIndex: 2,
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants, {
			variable: { wght: { min: 300, max: 800 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-sliced.css'),
		);
	});

	it('variable: width axis with stretch', async () => {
		const variants: FontFace[] = [
			variableFace({
				subset: 'latin',
				weight: '400',
				axisKey: 'wdth',
				stretch: '75% 125%',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-wdth-normal.woff2',
			}),
		];

		const assets = generateCSSFromFaces('TestFont', variants, {
			variable: { wdth: { min: 75, max: 125 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-wdth.css'),
		);
	});

	it('variable: multiple formats (woff2 + woff)', async () => {
		const variants: FontFace[] = [
			variableFace({
				subset: 'latin',
				weight: '400 600',
				unicodeRange: 'U+0000-00FF',
				sources: [
					{
						format: 'woff2',
						filename: 'inter-latin-wght-normal.woff2',
					},
					{
						format: 'woff',
						filename: 'inter-latin-wght-normal.woff',
					},
				],
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants, {
			variable: { wght: { min: 400, max: 600 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-multiple-formats.css'),
		);
	});

	it('static: comprehensive (multi-subset, sliced, multi-format)', async () => {
		const variants: FontFace[] = [
			// latin with woff2 + woff
			staticFace({
				subset: 'latin',
				weight: 400,
				unicodeRange: 'U+0000-00FF',
				sources: [
					{
						format: 'woff2',
						filename: 'inter-latin-400-normal.woff2',
					},
					{
						format: 'woff',
						filename: 'inter-latin-400-normal.woff',
					},
				],
			}),
			// latin-ext with woff2 only
			staticFace({
				subset: 'latin-ext',
				weight: 400,
				unicodeRange: 'U+0100-024F',
				filename: 'inter-latin-ext-400-normal.woff2',
			}),
			// japanese sliced subsets
			staticFace({
				subset: 'japanese',
				weight: 400,
				unicodeRange: 'U+3041-3042',
				filename: 'inter-japanese-400-normal-1.woff2',
				sliceIndex: 1,
			}),
			staticFace({
				subset: 'japanese',
				weight: 400,
				unicodeRange: 'U+3044-3045',
				filename: 'inter-japanese-400-normal-2.woff2',
				sliceIndex: 2,
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants);

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-comprehensive.css'),
		);
	});

	it('variable: comprehensive (multi-subset, mixed axes, sliced)', async () => {
		const variants: FontFace[] = [
			// latin — wght normal (woff2 + woff)
			variableFace({
				subset: 'latin',
				weight: '100 900',
				unicodeRange: 'U+0000-00FF',
				sources: [
					{
						format: 'woff2',
						filename: 'inter-latin-wght-normal.woff2',
					},
					{
						format: 'woff',
						filename: 'inter-latin-wght-normal.woff',
					},
				],
			}),
			// latin-ext — slnt italic
			variableFace({
				subset: 'latin-ext',
				weight: '400',
				style: 'oblique 10deg 10deg',
				axisKey: 'slnt',
				unicodeRange: 'U+0100-024F',
				filename: 'inter-latin-ext-slnt-italic.woff2',
			}),
			// japanese — wght normal, sliced
			variableFace({
				subset: 'japanese',
				weight: '300 800',
				unicodeRange: 'U+3041-3042',
				filename: 'inter-japanese-wght-normal-1.woff2',
				sliceIndex: 1,
			}),
			variableFace({
				subset: 'japanese',
				weight: '300 800',
				unicodeRange: 'U+3044-3045',
				filename: 'inter-japanese-wght-normal-2.woff2',
				sliceIndex: 2,
			}),
		];

		const assets = generateCSSFromFaces('Inter', variants, {
			variable: { wght: { min: 100, max: 900 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-comprehensive.css'),
		);
	});
});

// ---------------------------------------------------------------------------
// generateCSS — convenience wrapper
// ---------------------------------------------------------------------------

describe('generateCSS', () => {
	it('static config expands correctly', async () => {
		const assets = generateCSS({
			id: 'inter',
			family: 'Inter',
			subsets: ['latin', 'latin-ext'],
			weights: [400, 700],
			styles: ['normal', 'italic'],
			unicodeRange: {
				latin: 'U+0000-00FF',
				'latin-ext': 'U+0100-024F',
			},
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-static.css'),
		);
	});

	it('variable config expands correctly', async () => {
		const assets = generateCSS({
			id: 'inter',
			family: 'Inter',
			subsets: ['latin'],
			weights: [],
			styles: ['normal', 'italic'],
			unicodeRange: { latin: 'U+0000-00FF' },
			variable: {
				wght: { min: 100, max: 900 },
			},
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-variable.css'),
		);
	});
});
