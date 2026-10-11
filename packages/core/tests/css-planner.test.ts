import { describe, expect, it } from 'vitest';
import { generateCSSAssets } from '../src/css/assets';
import type { FontFace } from '../src/types';

type FaceOverrides = Partial<Omit<FontFace, 'sources'>> & {
	filename?: string;
};

const staticFace = (
	overrides: FaceOverrides & { subset: string; weight: number },
): FontFace => ({
	style: 'normal',
	isVariable: false,
	unicodeRange: '',
	sources: [
		{
			format: 'woff2',
			filename: overrides.filename ?? 'fixture.woff2',
		},
	],
	sliceIndex: 0,
	...overrides,
});

const variableFace = (
	overrides: FaceOverrides & { subset: string },
): FontFace => ({
	weight: '100 900',
	style: 'normal',
	isVariable: true,
	unicodeRange: '',
	sources: [
		{
			format: 'woff2',
			filename: overrides.filename ?? 'fixture.woff2',
		},
	],
	axisKey: 'wght',
	stretch: null,
	sliceIndex: 0,
	...overrides,
});

describe('CSS package entrypoints', () => {
	it('preserves named imports while slices replace only their own aggregate subset', () => {
		expect(
			generateCSSAssets('Fixture', [
				staticFace({ subset: 'latin', weight: 400, filename: 'latin.woff2' }),
				staticFace({
					subset: 'japanese',
					weight: 400,
					filename: 'japanese.woff2',
				}),
				staticFace({
					subset: 'japanese',
					weight: 400,
					sliceIndex: 7,
					filename: 'japanese-7.woff2',
				}),
				staticFace({
					subset: 'japanese',
					weight: 400,
					sliceIndex: 12,
					filename: 'japanese-12.woff2',
				}),
			]),
		).toMatchSnapshot();
	});
	it('prefers normal static faces and uses italic entrypoints for oblique-only packages', () => {
		expect({
			normalPreferred: generateCSSAssets('Fixture', [
				staticFace({ subset: 'latin', weight: 400, style: 'italic' }),
				staticFace({ subset: 'latin', weight: 700 }),
			]),
			obliqueOnly: generateCSSAssets('Fixture', [
				staticFace({ subset: 'latin', weight: 300, style: 'oblique 12deg' }),
			]),
		}).toMatchSnapshot();
	});
	it('selects index.css from the variable bundles actually published', () => {
		expect({
			italicOnly: generateCSSAssets(
				'Fixture',
				[variableFace({ subset: 'latin', style: 'italic' })],
				{ variable: { wght: { min: 100, max: 900 } } },
			),
			fullOnly: generateCSSAssets(
				'Fixture',
				[variableFace({ subset: 'latin', axisKey: 'full' })],
				{ variable: { wght: { min: 100, max: 900 } } },
			),
			partialAxes: generateCSSAssets(
				'Fixture',
				[
					variableFace({ subset: 'latin', style: 'italic' }),
					variableFace({ subset: 'latin' }),
				],
				{
					variable: {
						CTRS: { min: 0, max: 100 },
						wght: { min: 100, max: 900 },
					},
				},
			),
			obliqueSlices: generateCSSAssets(
				'Fixture',
				[
					variableFace({
						subset: 'japanese',
						sliceIndex: 7,
						filename: 'japanese-7.woff2',
						style: 'oblique 0deg 15deg',
					}),
					variableFace({
						subset: 'japanese',
						sliceIndex: 12,
						filename: 'japanese-12.woff2',
						style: 'oblique 0deg 15deg',
					}),
				],
				{ variable: { wght: { min: 100, max: 900 } } },
			),
		}).toMatchSnapshot();
	});
});
