import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	type CSSFontFace,
	generateCSS,
	generateCSSAssets,
	renderFontFaceRule,
	resolveFontFaces,
} from '../src/css';
import type {
	FontConfig,
	FontFace,
	FontFileFormat,
	FontSource,
} from '../src/types';

const snapshotDir = resolve(
	fileURLToPath(import.meta.url),
	'../__snapshots__/css',
);

type FaceOverrides = Partial<Omit<FontFace, 'sources'>> & {
	filename?: string;
	format?: FontFileFormat;
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

describe('renderFontFaceRule', () => {
	const face: CSSFontFace = {
		family: 'Example "Font"\\Name\n',
		style: 'oblique -20deg 10deg',
		weight: '100 900',
		isVariable: true,
		stretch: '75% 125%',
		unicodeRange: 'U+2190-2300',
		sources: [
			{ url: './font.woff2', format: 'woff2-variations' },
			{ url: './font.otf', format: 'opentype' },
		],
	};

	it('renders escaped family names and ordered sources in regular and compact CSS', async () => {
		await expect(
			renderFontFaceRule(face, { display: 'optional' }),
		).toMatchFileSnapshot(resolve(snapshotDir, 'rule-escaped.css'));
		await expect(
			renderFontFaceRule(face, { display: 'optional', minify: true }),
		).toMatchFileSnapshot(resolve(snapshotDir, 'rule-escaped.min.css'));
	});
});

describe('generateCSS', () => {
	it('preserves published CJK filenames and ranges without reconstructing slices', async () => {
		const faces = [
			variableFace({
				subset: 'chinese-simplified',
				sliceIndex: 4,
				filename: 'noto-sans-sc-4-wght-normal.woff2',
				unicodeRange: 'U+1F1E9-1F1F5',
			}),
			variableFace({
				subset: 'chinese-simplified',
				sliceIndex: 5,
				filename: 'noto-sans-sc-5-wght-normal.woff2',
				unicodeRange: 'U+FEE3,U+FEF3',
			}),
		] as const;
		const css = generateCSS('Noto Sans SC', faces, {
			display: 'optional',
			resolver: ({ source }) => `https://example.com/5.3.0/${source.filename}`,
		});

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'faces-published-cjk.css'),
		);
	});

	it('preserves math coverage in both combined and package stylesheets', async () => {
		const faces = [
			staticFace({
				subset: 'math',
				weight: 400,
				filename: 'noto-sans-math-400-normal.woff2',
				unicodeRange: 'U+2190-2300',
			}),
		] as const;
		const combined = generateCSS('Noto Sans Math', faces);
		const assets = generateCSSAssets('Noto Sans Math', faces);

		await expect(combined).toMatchFileSnapshot(
			resolve(snapshotDir, 'faces-math.css'),
		);
		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-math.css'),
		);
		const unrestricted = generateCSS('Noto Sans Math', [
			{ ...faces[0], unicodeRange: '' },
		]);
		await expect(unrestricted).toMatchFileSnapshot(
			resolve(snapshotDir, 'faces-math-unrestricted.css'),
		);
	});
});

describe('generateCSS single faces', () => {
	it('static font-face', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin',
				weight: 400,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static.css'),
		);
	});

	it('static bold font-face', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin',
				weight: 700,
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-700-normal.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-bold.css'),
		);
	});

	it('static italic font-face', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin',
				weight: 400,
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-italic.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-italic.css'),
		);
	});

	it('static oblique with decimal degrees', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin-ext',
				weight: 700,
				style: 'oblique 12.5deg',
				unicodeRange: 'U+0100-024F',
				filename: 'inter-latin-ext-700-italic.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-oblique-decimal.css'),
		);
	});

	it('static oblique with integer degrees', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin-ext',
				weight: 700,
				style: 'oblique 10deg',
				unicodeRange: 'U+0100-024F',
				filename: 'inter-latin-ext-700-italic.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-oblique-integer.css'),
		);
	});

	it('variable font-face with wght axis', async () => {
		const css = generateCSS('Inter', [
			variableFace({
				subset: 'latin',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-normal.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-wght.css'),
		);
	});

	it('variable font-face with width stretch', async () => {
		const css = generateCSS('TestFont', [
			variableFace({
				subset: 'latin',
				weight: '400',
				axisKey: 'wdth',
				stretch: '75% 125%',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-wdth-normal.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-stretch.css'),
		);
	});

	it('variable font-face with fixed width value', async () => {
		const css = generateCSS('TestFont', [
			variableFace({
				subset: 'latin',
				weight: '400',
				axisKey: 'wdth',
				stretch: '100%',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-wdth-normal.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-fixed-width.css'),
		);
	});

	it('variable font-face with slant axis and oblique style', async () => {
		const css = generateCSS('TestFont', [
			variableFace({
				subset: 'latin',
				weight: '400 700',
				style: 'oblique 0deg 15deg',
				axisKey: 'standard',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-standard-italic.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-slant.css'),
		);
	});

	it('sliced subset with slice index', async () => {
		const css = generateCSS('Inter', [
			variableFace({
				subset: 'japanese',
				weight: '300 800',
				unicodeRange: 'U+3041-3042',
				filename: 'inter-japanese-variable-1.woff2',
				sliceIndex: 1,
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-sliced.css'),
		);
	});

	it('resolver overrides url', async () => {
		const css = generateCSS(
			'Inter',
			[
				staticFace({
					subset: 'latin',
					weight: 400,
					unicodeRange: 'U+0000-00FF',
					filename: 'inter-latin-400-normal.woff2',
				}),
			],
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
		const css = generateCSS(
			'Inter',
			[
				staticFace({
					subset: 'latin',
					weight: 400,
					unicodeRange: 'U+0000-00FF',
					filename: 'inter-latin-400-normal.woff2',
				}),
			],
			{ display: 'block' },
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-display-block.css'),
		);
	});

	it('omits unicode-range when empty', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin',
				weight: 400,
				filename: 'inter-latin-400-normal.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-no-unicode-range.css'),
		);
	});

	it('does not double-append Variable to family name', async () => {
		const css = generateCSS('Inter Variable', [
			variableFace({
				subset: 'latin',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-normal.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-already-named.css'),
		);
	});

	it('woff format detection', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin',
				weight: 400,
				format: 'woff',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.woff',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-woff.css'),
		);
	});

	it('ttf format detection', async () => {
		const css = generateCSS('Inter', [
			staticFace({
				subset: 'latin',
				weight: 400,
				format: 'ttf',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-400-normal.ttf',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-static-ttf.css'),
		);
	});

	it('variable font-face with fixed slant value', async () => {
		const css = generateCSS('TestFont', [
			variableFace({
				subset: 'latin',
				weight: '300 600',
				style: 'oblique 12deg',
				axisKey: 'standard',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-standard-italic.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-fixed-slant.css'),
		);
	});

	it('variable font-face with slant axis only', async () => {
		const css = generateCSS('TestFont', [
			variableFace({
				subset: 'latin',
				weight: '400',
				style: 'oblique 10deg 10deg',
				axisKey: 'slnt',
				unicodeRange: 'U+0000-00FF',
				filename: 'testfont-latin-slnt-italic.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-slant-only.css'),
		);
	});

	it('variable font-face with no recognized axis', async () => {
		const css = generateCSS('Inter', [
			variableFace({
				subset: 'latin',
				weight: '100 900',
				axisKey: 'none',
				unicodeRange: 'U+0000-00FF',
				filename: 'no-axis.woff2',
			}),
		]);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'face-variable-no-axis.css'),
		);
	});

	it('throws when no backing source is provided', () => {
		expect(() =>
			generateCSS('Inter', [
				{
					subset: 'latin',
					weight: 400,
					style: 'normal',
					isVariable: false,
					unicodeRange: '',
					sources: [],
					sliceIndex: 0,
				},
			]),
		).toThrow('renderFontFace requires at least one source');
	});
});

// ---------------------------------------------------------------------------
// generateCSSAssets — grouped file output snapshots
// ---------------------------------------------------------------------------

describe('generateCSSAssets', () => {
	it('publishes the default for oblique-only faces', async () => {
		const assets = generateCSSAssets('Oblique', [
			staticFace({
				subset: 'latin',
				weight: 400,
				style: 'oblique 12deg',
				filename: 'oblique.woff2',
			}),
		]);
		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-oblique-only.css'),
		);
	});

	it('ignores the implicit italic axis when selecting the default bundle', async () => {
		const config: FontConfig = {
			family: 'Example',
			weights: [400],
			styles: ['normal', 'italic'],
			subsets: ['latin'],
			unicodeRange: { latin: 'U+0000-00FF' },
			variable: { wght: { min: 100, max: 900 }, ital: { min: 0, max: 1 } },
		};
		const assets = generateCSSAssets(config.family, resolveFontFaces(config), {
			variable: config.variable,
		});
		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-ital-axis.css'),
		);
	});

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

		const assets = generateCSSAssets('Inter', variants);

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-full.css'),
		);
	});

	it('returns no assets when no faces are provided', () => {
		expect(generateCSSAssets('Inter', [])).toEqual([]);
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

		const assets = generateCSSAssets('Inter', variants);

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

		const assets = generateCSSAssets('Inter', variants);

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-italic-only.css'),
		);
	});

	it('static: index.css prefers the closest normal face over italic fallback', async () => {
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

		const assets = generateCSSAssets('Inter', variants);
		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-static-normal-fallback.css'),
		);
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

		const assets = generateCSSAssets('Inter', variants, {
			variable: { wght: { min: 100, max: 900 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-wght.css'),
		);
	});

	it('variable: italic-only font falls back for index.css', async () => {
		const variants: FontFace[] = [
			variableFace({
				subset: 'latin',
				style: 'italic',
				unicodeRange: 'U+0000-00FF',
				filename: 'inter-latin-wght-italic.woff2',
			}),
		];

		const assets = generateCSSAssets('Inter', variants, {
			variable: { wght: { min: 100, max: 900 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-italic-only.css'),
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

		const assets = generateCSSAssets('Inter', variants, {
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

		const assets = generateCSSAssets('TestFont', variants, {
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

		const assets = generateCSSAssets('Inter', variants, {
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

		const assets = generateCSSAssets('Inter', variants);

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

		const assets = generateCSSAssets('Inter', variants, {
			variable: { wght: { min: 100, max: 900 } },
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'grouped-variable-comprehensive.css'),
		);
	});
});

// ---------------------------------------------------------------------------
// Config planning and CSS rendering
// ---------------------------------------------------------------------------

describe('generateCSS', () => {
	it('static config expands correctly', async () => {
		const config: FontConfig = {
			id: 'inter',
			family: 'Inter',
			subsets: ['latin', 'latin-ext'],
			weights: [400, 700],
			styles: ['normal', 'italic'],
			unicodeRange: {
				latin: 'U+0000-00FF',
				'latin-ext': 'U+0100-024F',
			},
		};
		const assets = generateCSSAssets(config.family, resolveFontFaces(config), {
			variable: config.variable,
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-static.css'),
		);
	});

	it('variable config expands correctly', async () => {
		const config: FontConfig = {
			id: 'inter',
			family: 'Inter',
			subsets: ['latin'],
			weights: [],
			styles: ['normal', 'italic'],
			unicodeRange: { latin: 'U+0000-00FF' },
			variable: {
				wght: { min: 100, max: 900 },
			},
		};
		const assets = generateCSSAssets(config.family, resolveFontFaces(config), {
			variable: config.variable,
		});

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-variable.css'),
		);
	});

	it('variable config can emit multiple published axis keys', async () => {
		const config: FontConfig = {
			id: 'recursive',
			family: 'Recursive',
			subsets: ['latin'],
			weights: [300, 700],
			styles: ['normal', 'italic'],
			unicodeRange: { latin: 'U+0000-00FF' },
			variable: {
				MONO: { min: 0, max: 1 },
				wght: { min: 300, max: 700 },
				slnt: { min: -15, max: 0 },
			},
		};
		const assets = generateCSSAssets(
			config.family,
			resolveFontFaces(config, ['MONO', 'standard', 'full']),
			{ variable: config.variable },
		);

		await expect(serialiseAssets(assets)).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-variable-axis-keys.css'),
		);
	});
});

describe('generateCSS', () => {
	it('renders one deduplicated stylesheet for preview callers', async () => {
		const config: FontConfig = {
			id: 'inter',
			family: 'Inter',
			subsets: ['latin'],
			weights: [400],
			styles: ['normal'],
			unicodeRange: { latin: 'U+0000-00FF' },
			formats: ['woff2', 'woff'],
		};
		const css = generateCSS(config.family, resolveFontFaces(config));

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-combined-multiple-formats.css'),
		);
	});

	it('renders registry-defined subset slices with their published filenames', async () => {
		const config: FontConfig = {
			id: 'noto-sans-jp',
			family: 'Noto Sans JP',
			subsets: ['japanese'],
			weights: [400],
			styles: ['normal'],
			formats: ['woff2'],
			subsetSlices: {
				japanese: [
					{ id: 1, unicodeRange: 'U+3000-303F' },
					{ id: 2, unicodeRange: 'U+3040-30FF' },
				],
			},
		};
		const css = generateCSS(config.family, resolveFontFaces(config));

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-combined-sliced.css'),
		);
	});

	it('uses every published variable axis key in one combined stylesheet by default', async () => {
		const config: FontConfig = {
			id: 'recursive',
			family: 'Recursive',
			subsets: ['latin'],
			weights: [300, 700],
			styles: ['normal'],
			unicodeRange: { latin: 'U+0000-00FF' },
			formats: ['woff2'],
			variable: {
				wght: { min: 300, max: 700 },
				slnt: { min: -15, max: 0 },
			},
		};
		const css = generateCSS(config.family, resolveFontFaces(config));

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'config-combined-variable-axis-keys.css'),
		);
	});
});
