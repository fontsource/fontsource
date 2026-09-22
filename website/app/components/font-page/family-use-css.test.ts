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
			metadata,
			isVariable: false,
			styles: ['normal', 'italic'],
			weights: [400, 700],
			subsets: ['latin', 'cyrillic'],
			activeAxes: [],
			display: 'optional',
			version: '5.3.0',
			delivery: 'cdn',
		});

		await expect(css).toMatchFileSnapshot(
			'./__snapshots__/family-use-static.css',
		);
	});

	it('generates the selected variable-axis package for self-hosting', async () => {
		const css = buildFamilyUseCSS({
			metadata,
			variable,
			isVariable: true,
			styles: ['normal'],
			weights: metadata.weights,
			subsets: ['latin'],
			activeAxes: ['wght', 'wdth'],
			display: 'swap',
			version: '5.3.0',
			delivery: 'package',
		});

		await expect(css).toMatchFileSnapshot(
			'./__snapshots__/family-use-variable.css',
		);
	});

	it('expands a semantic subset into every registry-defined slice', async () => {
		const css = buildFamilyUseCSS({
			metadata: {
				...metadata,
				subsets: ['japanese'],
				unicodeRange: { japanese: 'U+3000-30FF' },
			},
			isVariable: false,
			styles: ['normal'],
			weights: [400],
			subsets: ['japanese'],
			activeAxes: [],
			display: 'swap',
			version: '5.3.0',
			delivery: 'cdn',
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
		});

		await expect(css).toMatchFileSnapshot(
			'./__snapshots__/family-use-sliced.css',
		);
	});
});
