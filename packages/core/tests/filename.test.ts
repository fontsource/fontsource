import { describe, expect, it } from 'vitest';
import {
	generateStaticFilename,
	generateVariableFilename,
	normalizeStyleForFilename,
} from '../src/filename';

describe('filename generation', () => {
	describe('normalizeStyleForFilename', () => {
		it('should normalize normal to normal', () => {
			expect(normalizeStyleForFilename('normal')).toBe('normal');
		});

		it('should normalize italic to italic', () => {
			expect(normalizeStyleForFilename('italic')).toBe('italic');
		});

		it('should normalize oblique to italic', () => {
			expect(normalizeStyleForFilename('oblique 10deg')).toBe('italic');
		});
	});

	describe('static filenames', () => {
		it('should generate standard static filename', () => {
			expect(
				generateStaticFilename('inter', 'latin', 400, 'normal', 0, 'woff2'),
			).toBe('inter-latin-400-normal.woff2');
		});

		it('should generate italic static filename', () => {
			expect(
				generateStaticFilename('inter', 'latin', 700, 'italic', 0, 'woff2'),
			).toBe('inter-latin-700-italic.woff2');
		});

		it('should generate sliced static filename', () => {
			expect(
				generateStaticFilename(
					'noto-sans-jp',
					'japanese',
					400,
					'normal',
					1,
					'woff2',
				),
			).toBe('noto-sans-jp-japanese-400-normal-1.woff2');
		});
	});

	describe('variable filenames', () => {
		it('should generate wght-only variable filename', () => {
			expect(
				generateVariableFilename(
					'inter',
					'latin',
					'wght',
					'normal',
					0,
					'woff2',
				),
			).toBe('inter-latin-wght-normal.woff2');
		});

		it('should generate full variable filename', () => {
			expect(
				generateVariableFilename(
					'inter',
					'latin',
					'full',
					'italic',
					0,
					'woff2',
				),
			).toBe('inter-latin-full-italic.woff2');
		});

		it('should lowercase axis keys', () => {
			expect(
				generateVariableFilename(
					'inter',
					'latin',
					'WGHT',
					'normal',
					0,
					'woff2',
				),
			).toBe('inter-latin-wght-normal.woff2');
		});
	});
});
