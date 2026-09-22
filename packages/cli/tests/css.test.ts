import { describe, expect, it } from 'vitest';

import { type FontObject, generateFontFace } from '../src/css';

const font: FontObject = {
	family: 'Open Sans',
	style: 'normal',
	display: 'swap',
	weight: 400,
	src: [{ url: './fonts/open-sans-v17-latin-regular.woff2', format: 'woff2' }],
};

const cases: { name: string; overrides: Partial<FontObject> }[] = [
	{ name: 'should generate a single font-face', overrides: {} },
	{
		name: 'should generate a single font face with multiple formats',
		overrides: {
			src: [
				...font.src,
				{ url: './fonts/open-sans-v17-latin-regular.woff', format: 'woff' },
			],
		},
	},
	{
		name: 'should generate a single font face with different display',
		overrides: { display: 'optional' },
	},
	{
		name: 'should generate a single font face with unicode range',
		overrides: { unicodeRange: 'U+000-5FF', comment: 'latin' },
	},
	{
		name: 'should generate a single font face with variable wght',
		overrides: {
			family: 'Open Sans Variable',
			variable: { wght: { min: 400, max: 700 } },
		},
	},
	{
		name: 'should generate a single font face with font stretch',
		overrides: {
			family: 'Open Sans Variable',
			variable: { stretch: { min: 50, max: 200 } },
		},
	},
	{
		name: 'should generate a single font face with slnt axis',
		overrides: {
			family: 'Open Sans Variable',
			variable: { slnt: { min: -10, max: 20 } },
		},
	},
	{
		name: 'should generate a single font face with all variable axis',
		overrides: {
			family: 'Open Sans Variable',
			variable: {
				wght: { min: 400, max: 700 },
				slnt: { min: -15, max: 25 },
				stretch: { min: 55, max: 250 },
			},
			unicodeRange: 'U+000-5FF',
			comment: 'latin',
		},
	},
	{
		name: 'preserves fixed variable weight and source formats',
		overrides: {
			variable: { wght: { min: 400, max: 400 } },
			src: [...font.src, { url: './example.otf', format: 'opentype' }],
		},
	},
];

describe('generate font face', () => {
	for (const { name, overrides } of cases) {
		it(name, () => {
			expect(generateFontFace({ ...font, ...overrides })).toMatchSnapshot();
		});
	}
});
