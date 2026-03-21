import { describe, expect, it } from 'vitest';
import {
	getAssetFilenames,
	groupFacesByAssetFilename,
	pickStaticIndexFile,
	pickVariableIndexFile,
} from '../src/css/planner';
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

describe('css planner', () => {
	it('assigns static faces to weight and subset assets', () => {
		expect(
			getAssetFilenames(
				staticFace({
					subset: 'latin',
					weight: 400,
				}),
			),
		).toEqual(['400.css', 'latin.css']);

		expect(
			getAssetFilenames(
				staticFace({
					subset: 'latin',
					weight: 400,
					style: 'italic',
				}),
			),
		).toEqual(['400-italic.css', 'latin.css', 'latin-italic.css']);
	});

	it('assigns variable faces to axis assets', () => {
		expect(
			getAssetFilenames(
				variableFace({
					subset: 'latin',
				}),
			),
		).toEqual(['wght.css']);

		expect(
			getAssetFilenames(
				variableFace({
					subset: 'latin',
					style: 'italic',
				}),
			),
		).toEqual(['wght-italic.css']);
	});

	it('groups sliced faces into the same planned asset', () => {
		const faces = [
			variableFace({
				subset: 'japanese',
				sliceIndex: 1,
				filename: 'japanese-1.woff2',
			}),
			variableFace({
				subset: 'japanese',
				sliceIndex: 2,
				filename: 'japanese-2.woff2',
			}),
		];

		const assetPlan = groupFacesByAssetFilename(faces);

		expect(assetPlan.get('wght.css')).toEqual(faces);
	});

	it('selects a normal static asset for index.css before falling back to italic', () => {
		const faces = [
			staticFace({
				subset: 'latin',
				weight: 400,
				style: 'italic',
			}),
			staticFace({
				subset: 'latin',
				weight: 700,
			}),
		];

		expect(pickStaticIndexFile(faces)).toBe('700.css');
	});

	it('falls back to the italic variable asset for index.css when normal is missing', () => {
		const faces = [
			variableFace({
				subset: 'latin',
				style: 'italic',
			}),
		];

		expect(
			pickVariableIndexFile(
				{ wght: { min: 100, max: 900 } },
				groupFacesByAssetFilename(faces),
			),
		).toBe('wght-italic.css');
	});
});
