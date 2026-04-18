import { expect, it } from 'vitest';
import { resolveFontPackageManifest } from '../shared/font-package-manifest';
import type { SourceFontMetadata, VariableAxes } from '../shared/catalog';
import { staticMetadata, variableAxes, variableMetadata } from './helpers';

it('generates static manifest entries', () => {
	expect(resolveFontPackageManifest(staticMetadata).static).toMatchSnapshot();
});

it('generates variable manifest entries', () => {
	expect(
		resolveFontPackageManifest(variableMetadata, variableAxes).variable,
	).toMatchSnapshot();
});

it('uses published variable filenames for slanted axis combinations', () => {
	const metadata: SourceFontMetadata = {
		id: 'slanted',
		family: 'Slanted',
		subsets: ['latin'],
		weights: [400],
		styles: ['normal'],
		defSubset: 'latin',
		variable: {
			MONO: {
				default: '0',
				min: '0',
				max: '1',
				step: '0.01',
			},
			slnt: {
				default: '0',
				min: '-15',
				max: '0',
				step: '1',
			},
			wght: {
				default: '400',
				min: '300',
				max: '900',
				step: '1',
			},
		},
		lastModified: '2024-01-04',
		version: 'v1',
		category: 'sans-serif',
		license: {
			type: 'OFL-1.1',
			url: 'https://example.com/ofl',
			attribution: 'Example',
		},
		source: 'https://example.com',
		type: 'google',
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	};
	const axes = metadata.variable as VariableAxes;
	const filenames = resolveFontPackageManifest(metadata, axes).variable.map(
		(item) => item.filename,
	);

	expect(filenames).toEqual(
		expect.arrayContaining([
			'latin-mono-normal.woff2',
			'latin-wght-normal.woff2',
			'latin-slnt-normal.woff2',
			'latin-standard-normal.woff2',
			'latin-full-normal.woff2',
		]),
	);
	expect(filenames.some((item) => item.includes('oblique'))).toBe(false);
});
