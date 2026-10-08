import { expect, it } from 'vitest';

import { makeFontFilePath } from '../src/utils';

it('generates font file paths', () => {
	expect(makeFontFilePath('font', 'subset', '400', 'normal', 'woff2')).toBe(
		'./files/font-subset-400-normal.woff2',
	);
});
