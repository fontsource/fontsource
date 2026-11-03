import { describe, expect, it } from 'vitest';

import type { GetFontResponse, GetVariableFontResponse } from '@/generated/api';

import { buildFamilyUsageCSS, buildFamilyUseCSS } from './family-use-css';

const metadata = {
	id: 'example',
	family: 'Example',
	weights: [400, 700],
	styles: ['normal', 'italic'],
	subsets: ['latin', 'cyrillic'],
	defSubset: 'latin',
	variable: true,
	lastModified: '2026-08-01',
	category: 'sans-serif',
	license: 'OFL-1.1',
	type: 'google',
	version: 'v1',
	source: 'https://example.com',
	unicodeRange: {
		latin: 'U+0000-00FF',
		cyrillic: 'U+0400-04FF',
	},
	variants: {},
} satisfies GetFontResponse;

const variable = {
	family: 'Example',
	axes: {
		wght: { min: '100', max: '900', default: '400', step: '1' },
		wdth: { min: '75', max: '125', default: '100', step: '1' },
	},
} satisfies GetVariableFontResponse;

describe('buildFamilyUseCSS', () => {
	it('generates a valid body rule for a variable family', () => {
		const css = buildFamilyUsageCSS(metadata, true, 400, 'normal');

		expect(css).toBe(`body {
  font-family: 'Example Variable', sans-serif;
  font-weight: 400;
  font-style: normal;
}`);
	});

	it('generates all selected static faces as WOFF2 with display behavior', async () => {
		const css = buildFamilyUseCSS({
			fontPackage: { metadata, legacy: metadata, version: '5.3.0' },
			isVariable: false,
			styles: ['normal', 'italic'],
			weights: [400, 700],
			activeAxes: [],
			display: 'optional',
			delivery: 'cdn',
		});

		await expect(css).toMatchFileSnapshot(
			'./__snapshots__/family-use-static.css',
		);
	});

	it('generates the selected variable-axis package for self-hosting', async () => {
		const css = buildFamilyUseCSS({
			fontPackage: {
				metadata,
				legacy: { ...metadata, subsets: ['latin'] },
				variable,
				version: '5.3.0',
			},
			isVariable: true,
			styles: ['normal'],
			weights: metadata.weights,
			activeAxes: ['wght', 'wdth'],
			display: 'swap',
			delivery: 'package',
		});

		await expect(css).toMatchFileSnapshot(
			'./__snapshots__/family-use-variable.css',
		);
	});

	it('expands a semantic subset into every registry-defined slice', async () => {
		const css = buildFamilyUseCSS({
			fontPackage: {
				metadata,
				version: '5.3.0',
				legacy: {
					...metadata,
					subsets: ['japanese'],
					unicodeRange: { japanese: 'U+3000-30FF' },
				},
				subsetDefinitions: [
					{
						id: 'japanese',
						ranges: [['3000', '30FF']],
						slices: [
							{ id: '1', ranges: [['3000', '303F']] },
							{ id: '2', ranges: [['3040', '30FF']] },
						],
					},
				],
			},
			isVariable: false,
			styles: ['normal'],
			weights: [400],
			activeAxes: [],
			display: 'swap',
			delivery: 'cdn',
		});

		await expect(css).toMatchFileSnapshot(
			'./__snapshots__/family-use-sliced.css',
		);
	});
});

it('uses published entrypoint order and coverage instead of reconstructing sliced or full-font faces', async () => {
	const css = buildFamilyUseCSS({
		fontPackage: {
			version: '6.0.0',
			metadata,
			manifest: {
				schemaVersion: 1,
				family: 'Example',
				sourceModified: '2026-08-01',
				faces: [
					{
						subset: 'japanese',
						sliceIndex: 0,
						weight: 400,
						style: 'normal',
						isVariable: false,
						unicodeRange: 'U+3000-30FF',
						sources: [
							{
								filename: 'example-japanese-400-normal.woff2',
								format: 'woff2',
							},
						],
					},
					{
						subset: 'japanese',
						sliceIndex: 7,
						weight: 400,
						style: 'normal',
						isVariable: false,
						unicodeRange: 'U+3000-303F',
						sources: [
							{ filename: 'example-7-400-normal.woff2', format: 'woff2' },
						],
					},
					{
						subset: 'japanese',
						sliceIndex: 12,
						weight: 400,
						style: 'normal',
						isVariable: false,
						unicodeRange: 'U+3040-30FF',
						sources: [
							{ filename: 'example-12-400-normal.woff2', format: 'woff2' },
						],
					},
					{
						subset: 'all',
						sliceIndex: 0,
						weight: 700,
						style: 'normal',
						isVariable: false,
						unicodeRange: '',
						sources: [
							{ filename: 'example-all-700-normal.woff2', format: 'woff2' },
						],
					},
				],
				entrypoints: {
					'index.css': [1, 2],
					'400.css': [2, 1],
					'700.css': [3],
					'japanese.css': [0],
				},
			},
		},
		isVariable: false,
		styles: ['normal'],
		weights: [400, 700],
		activeAxes: [],
		display: 'swap',
		delivery: 'cdn',
	});
	await expect(css).toMatchFileSnapshot(
		'./__snapshots__/family-use-manifest.css',
	);
});

it('renders a published variable entrypoint without requiring every source-axis package', async () => {
	const css = buildFamilyUseCSS({
		fontPackage: {
			metadata,
			variable,
			version: '6.0.0',
			manifest: {
				schemaVersion: 1,
				family: 'Example',
				sourceModified: '2026-08-01',
				faces: [
					{
						subset: 'all',
						sliceIndex: 0,
						weight: '250 800',
						style: 'oblique 0deg 12deg',
						isVariable: true,
						axisKey: 'standard',
						unicodeRange: '',
						sources: [
							{
								filename: 'example-all-standard-italic.woff2',
								format: 'woff2',
							},
						],
					},
				],
				entrypoints: { 'index.css': [0], 'standard-italic.css': [0] },
			},
		},
		isVariable: true,
		styles: ['oblique 0deg 12deg'],
		weights: [],
		activeAxes: ['standard'],
		display: 'optional',
		delivery: 'package',
	});
	await expect(css).toMatchFileSnapshot(
		'./__snapshots__/family-use-manifest-variable.css',
	);
});
