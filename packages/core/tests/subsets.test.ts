import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { generateSubsetData } from '../src/subsets';
import type { FontBuildConfig } from '../src/types';

const snapshotDir = resolve(
	fileURLToPath(import.meta.url),
	'../__snapshots__/subsets',
);

const readFixture = (
	type: 'nam-files' | 'slices',
	filename: string,
): string => {
	const fixturePath = join(__dirname, 'fixtures', type, filename);
	return readFileSync(fixturePath, 'utf-8');
};

describe('generate subset data', () => {
	describe('basic', () => {
		it('should correctly identify and process different subset file formats', () => {
			const config: FontBuildConfig = {
				type: 'static',
				family: 'Test Font',
				subsets: ['latin', 'japanese', 'ambiguous'],
				weights: [400],
				styles: ['normal'],
				formats: ['woff2'],
				featureSettings: {},
				subsetSources: {
					latin: '0x0020 SPACE\n0x0021 EXCLAMATION MARK', // Standard NAM file
					japanese: 'subsets {\n  codepoints: 12353\n}', // Slicing file
					// A file that is NOT a slicing file, despite containing the word "subsets"
					ambiguous: '0x0041 A # some comment about subsets',
				},
			};

			const result = generateSubsetData(config);
			expect(result.size).toBe(3);
			expect(result.get('latin')?.type).toBe('range');
			expect(result.get('japanese')?.type).toBe('sliced');
			expect(result.get('ambiguous')?.type).toBe('range');
		});

		it('should correctly structure data for multiple mixed subsets', () => {
			const config: FontBuildConfig = {
				type: 'static',
				family: 'Test Font',
				subsets: ['latin', 'japanese'],
				weights: [400],
				styles: ['normal'],
				formats: ['woff2'],
				featureSettings: {},
				subsetSources: {
					latin: '0x0020 SPACE\n0x0021 EXCLAMATION MARK',
					japanese: `
SlicingStrategy {
  subsets {
    codepoints: 12353
  }
}
					`,
				},
			};

			const result = generateSubsetData(config);
			expect(result.size).toBe(2);

			const latinSubset = result.get('latin');
			expect(latinSubset?.type).toBe('range');
			if (latinSubset?.type === 'range') {
				expect(latinSubset.codepoints).toEqual([32, 33]);
				expect(latinSubset.unicodeRange).toBe('U+20-21');
			}

			const japaneseSubset = result.get('japanese');
			expect(japaneseSubset?.type).toBe('sliced');
			if (japaneseSubset?.type === 'sliced') {
				expect(japaneseSubset.slices).toHaveLength(1);
				expect(japaneseSubset.slices[0].codepoints).toEqual([12353]);
			}
		});
	});

	describe('edge cases', () => {
		it('should warn and skip if subset content is missing', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const config: FontBuildConfig = {
				type: 'static',
				family: 'Test Font',
				subsets: ['latin', 'cyrillic'],
				weights: [400],
				styles: ['normal'],
				formats: ['woff2'],
				featureSettings: {},
				subsetSources: {
					latin: '0x0020 SPACE',
					// cyrillic content is missing
				},
			};

			const result = generateSubsetData(config);
			expect(result.size).toBe(1);
			expect(result.has('latin')).toBe(true);
			expect(result.has('cyrillic')).toBe(false);
			expect(consoleSpy).toHaveBeenCalledWith(
				'WARN: No subset file content provided for cyrillic',
			);
			consoleSpy.mockRestore();
		});

		it('should warn and skip subsets with empty file content', () => {
			const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
			const config: FontBuildConfig = {
				type: 'static',
				family: 'Test Font',
				subsets: ['empty'],
				weights: [400],
				styles: ['normal'],
				formats: ['woff2'],
				featureSettings: {},
				subsetSources: {
					empty: '',
				},
			};

			const result = generateSubsetData(config);
			expect(result.size).toBe(0);
			expect(consoleSpy).toHaveBeenCalledWith(
				'WARN: No subset file content provided for empty',
			);
			consoleSpy.mockRestore();
		});

		it('should handle whitespace-only content as an empty range', () => {
			const config: FontBuildConfig = {
				type: 'static',
				family: 'Test Font',
				subsets: ['whitespace'],
				weights: [400],
				styles: ['normal'],
				formats: ['woff2'],
				featureSettings: {},
				subsetSources: {
					whitespace: '  \n\t\n  ',
				},
			};

			const result = generateSubsetData(config);
			expect(result.size).toBe(1);
			const subset = result.get('whitespace');
			expect(subset?.type).toBe('range');
			if (subset?.type === 'range') {
				expect(subset.codepoints).toEqual([]);
				expect(subset.unicodeRange).toBe('');
			}
		});

		it('should handle an empty but valid slicing strategy file', () => {
			const config: FontBuildConfig = {
				type: 'static',
				family: 'Test Font',
				subsets: ['test'],
				weights: [400],
				styles: ['normal'],
				formats: ['woff2'],
				featureSettings: {},
				subsetSources: {
					test: 'subsets {\n}',
				},
			};

			const result = generateSubsetData(config);
			const testSubset = result.get('test');
			expect(testSubset?.type).toBe('sliced');
			if (testSubset?.type === 'sliced') {
				expect(testSubset.slices).toHaveLength(0);
			}
		});
	});

	describe('file snapshots', () => {
		describe('NAM files', () => {
			it('should process latin NAM file correctly', async () => {
				const latinContent = readFixture(
					'nam-files',
					'latin_unique-glyphs.nam',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['latin'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						latin: latinContent,
					},
				};

				const result = generateSubsetData(config);
				const latinSubset = result.get('latin');

				await expect(JSON.stringify(latinSubset, null, 2)).toMatchFileSnapshot(
					resolve(snapshotDir, 'latin-nam-subset.json'),
				);
			});

			it('should process arabic NAM file correctly', async () => {
				const arabicContent = readFixture(
					'nam-files',
					'arabic_unique-glyphs.nam',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['arabic'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						arabic: arabicContent,
					},
				};

				const result = generateSubsetData(config);
				const arabicSubset = result.get('arabic');

				await expect(JSON.stringify(arabicSubset, null, 2)).toMatchFileSnapshot(
					resolve(snapshotDir, 'arabic-nam-subset.json'),
				);
			});

			it('should process latin-ext NAM file correctly', async () => {
				const latinExtContent = readFixture(
					'nam-files',
					'latin-ext_unique-glyphs.nam',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['latin-ext'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						'latin-ext': latinExtContent,
					},
				};

				const result = generateSubsetData(config);
				const latinExtSubset = result.get('latin-ext');

				await expect(
					JSON.stringify(latinExtSubset, null, 2),
				).toMatchFileSnapshot(
					resolve(snapshotDir, 'latin-ext-nam-subset.json'),
				);
			});

			it('should process signwriting NAM file correctly', async () => {
				const signwritingContent = readFixture(
					'nam-files',
					'signwriting_unique-glyphs.nam',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['signwriting'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						signwriting: signwritingContent,
					},
				};

				const result = generateSubsetData(config);
				const signwritingSubset = result.get('signwriting');

				await expect(
					JSON.stringify(signwritingSubset, null, 2),
				).toMatchFileSnapshot(
					resolve(snapshotDir, 'signwriting-nam-subset.json'),
				);
			});

			it('should process symbols2 NAM file correctly', async () => {
				const symbols2Content = readFixture(
					'nam-files',
					'symbols2_unique-glyphs.nam',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['symbols2'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						symbols2: symbols2Content,
					},
				};

				const result = generateSubsetData(config);
				const symbols2Subset = result.get('symbols2');

				await expect(
					JSON.stringify(symbols2Subset, null, 2),
				).toMatchFileSnapshot(resolve(snapshotDir, 'symbols2-nam-subset.json'));
			});
		});

		describe('Slicing Strategy Files', () => {
			it('should process Japanese slicing strategy correctly', async () => {
				const japaneseContent = readFixture('slices', 'japanese_default.txt');
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['japanese'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						japanese: japaneseContent,
					},
				};

				const result = generateSubsetData(config);
				const japaneseSubset = result.get('japanese');

				await expect(
					JSON.stringify(japaneseSubset, null, 2),
				).toMatchFileSnapshot(
					resolve(snapshotDir, 'japanese-slicing-subset.json'),
				);
			});

			it('should process Korean slicing strategy correctly', async () => {
				const koreanContent = readFixture('slices', 'korean_default.txt');
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['korean'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						korean: koreanContent,
					},
				};

				const result = generateSubsetData(config);
				const koreanSubset = result.get('korean');

				await expect(JSON.stringify(koreanSubset, null, 2)).toMatchFileSnapshot(
					resolve(snapshotDir, 'korean-slicing-subset.json'),
				);
			});

			it('should process Simplified Chinese slicing strategy correctly', async () => {
				const simplifiedChineseContent = readFixture(
					'slices',
					'simplified-chinese_default.txt',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['chinese-simplified'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						'chinese-simplified': simplifiedChineseContent,
					},
				};

				const result = generateSubsetData(config);
				const chineseSubset = result.get('chinese-simplified');

				await expect(
					JSON.stringify(chineseSubset, null, 2),
				).toMatchFileSnapshot(
					resolve(snapshotDir, 'chinese-simplified-slicing-subset.json'),
				);
			});

			it('should process Traditional Chinese slicing strategy correctly', async () => {
				const traditionalChineseContent = readFixture(
					'slices',
					'traditional-chinese_default.txt',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['chinese-traditional'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						'chinese-traditional': traditionalChineseContent,
					},
				};

				const result = generateSubsetData(config);
				const chineseSubset = result.get('chinese-traditional');

				await expect(
					JSON.stringify(chineseSubset, null, 2),
				).toMatchFileSnapshot(
					resolve(snapshotDir, 'chinese-traditional-slicing-subset.json'),
				);
			});

			it('should process Hong Kong Chinese slicing strategy correctly', async () => {
				const hongkongChineseContent = readFixture(
					'slices',
					'hongkong-chinese_default.txt',
				);
				const config: FontBuildConfig = {
					type: 'static',
					family: 'Test Font',
					subsets: ['chinese-hongkong'],
					weights: [400],
					styles: ['normal'],
					formats: ['woff2'],
					featureSettings: {},
					subsetSources: {
						'chinese-hongkong': hongkongChineseContent,
					},
				};

				const result = generateSubsetData(config);
				const chineseSubset = result.get('chinese-hongkong');

				await expect(
					JSON.stringify(chineseSubset, null, 2),
				).toMatchFileSnapshot(
					resolve(snapshotDir, 'chinese-hongkong-slicing-subset.json'),
				);
			});
		});
	});
});
