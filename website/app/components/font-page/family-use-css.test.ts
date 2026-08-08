import { describe, expect, it } from 'vitest';

import type { GetFontResponse, GetVariableFontResponse } from '@/generated/api';

import { buildFamilyUseCSS } from './family-use-css';

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
	it('generates all selected static faces, formats, and display behavior', () => {
		const css = buildFamilyUseCSS({
			metadata,
			isVariable: false,
			styles: ['normal', 'italic'],
			weights: [400, 700],
			subsets: ['latin', 'cyrillic'],
			activeAxes: [],
			formats: ['woff2', 'woff'],
			display: 'optional',
			version: '5.3.0',
			delivery: 'cdn',
		});

		expect(css).toContain('font-display: optional;');
		expect(css).toContain('cyrillic-700-italic.woff2');
		expect(css).toContain('cyrillic-700-italic.woff');
		expect(css.match(/@font-face/g)).toHaveLength(8);
	});

	it('generates the selected variable-axis package for self-hosting', () => {
		const css = buildFamilyUseCSS({
			metadata,
			variable,
			isVariable: true,
			styles: ['normal'],
			weights: metadata.weights,
			subsets: ['latin'],
			activeAxes: ['wght', 'wdth'],
			formats: ['woff2'],
			display: 'swap',
			version: '5.3.0',
			delivery: 'package',
		});

		expect(css).toContain("font-family: 'Example Variable';");
		expect(css).toContain('font-stretch: 75% 125%;');
		expect(css).toContain('@fontsource-variable/example/files/');
	});
});
