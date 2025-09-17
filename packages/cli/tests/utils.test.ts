import { describe, expect, it } from 'vitest';

import {
	makeFontDownloadPath,
	makeFontFilePath,
	makeVariableFontDownloadPath,
	makeVariableFontFilePath,
} from '../src/utils';

describe('utils', () => {
	describe('paths', () => {
		it('should generate font download paths', () => {
			expect(
				makeFontDownloadPath('fonts', 'font', 'subset', 400, 'normal', 'woff2'),
			).toBe('fonts/files/font-subset-400-normal.woff2');
		});

		it('should generate font file paths', () => {
			expect(makeFontFilePath('font', 'subset', '400', 'normal', 'woff2')).toBe(
				'./files/font-subset-400-normal.woff2',
			);
		});

		it('should generate variable font download paths', () => {
			expect(
				makeVariableFontDownloadPath(
					'fontDir',
					'font',
					'axes',
					'subset',
					'style',
				),
			).toBe('fontDir/files/font-axes-subset-style.woff2');
		});

		it('should generate variable font file paths', () => {
			expect(makeVariableFontFilePath('font', 'axes', 'subset', 'style')).toBe(
				'./files/font-axes-subset-style.woff2',
			);
		});
	});
});
