import { describe, expect, it } from 'vitest';
import {
	generateStaticFilename,
	generateVariableFilename,
} from '../src/filename';
import type { FontStyle, Format } from '../src/types';

describe('filename generation', () => {
	describe('static filenames', () => {
		// id, subset, weight, style, slice, format, expected
		it.each([
			// Regular weight, normal style, no slice
			[
				'inter',
				'latin',
				400,
				'normal',
				0,
				'woff2',
				'inter-latin-400-normal.woff2',
			],
			// Italic style
			[
				'inter',
				'latin',
				400,
				'italic',
				0,
				'woff2',
				'inter-latin-400-italic.woff2',
			],
			// Oblique style should normalize to italic
			[
				'inter',
				'latin',
				400,
				'oblique 10deg',
				0,
				'woff2',
				'inter-latin-400-italic.woff2',
			],
			// Bold weight
			[
				'inter',
				'latin',
				700,
				'normal',
				0,
				'woff2',
				'inter-latin-700-normal.woff2',
			],
			// Non-standard weight
			[
				'inter',
				'latin',
				450,
				'normal',
				0,
				'woff2',
				'inter-latin-450-normal.woff2',
			],
			// Different format (woff)
			[
				'inter',
				'latin',
				400,
				'normal',
				0,
				'woff',
				'inter-latin-400-normal.woff',
			],
			// Sliced font (sliceIndex > 0)
			[
				'noto-sans-jp',
				'japanese',
				400,
				'normal',
				1,
				'woff2',
				'noto-sans-jp-japanese-400-normal-1.woff2',
			],
			// Complex names, bold italic, high slice index, and woff format
			[
				'noto-sans-kr',
				'korean',
				700,
				'italic',
				3,
				'woff',
				'noto-sans-kr-korean-700-italic-3.woff',
			],
		])(
			'should correctly generate filename for %s-%s-%s-%s (slice %i, format %s)',
			(familyId, subset, weight, style, sliceIndex, format, expected) => {
				const filename = generateStaticFilename(
					familyId,
					subset,
					weight,
					style as FontStyle,
					sliceIndex,
					format as Format,
				);
				expect(filename).toBe(expected);
			},
		);
	});

	describe('variable filenames', () => {
		// id, subset, axis, style, slice, format, expected
		it.each([
			// wght axis, normal style, no slice
			[
				'inter',
				'latin',
				'wght',
				'normal',
				0,
				'woff2',
				'inter-latin-wght-normal.woff2',
			],
			// Italic style
			[
				'inter',
				'latin',
				'wght',
				'italic',
				0,
				'woff2',
				'inter-latin-wght-italic.woff2',
			],
			// Oblique style should normalize to italic
			[
				'inter',
				'latin',
				'wght',
				'oblique 10deg',
				0,
				'woff2',
				'inter-latin-wght-italic.woff2',
			],
			// Different axis keys
			[
				'inter',
				'latin',
				'standard',
				'normal',
				0,
				'woff2',
				'inter-latin-standard-normal.woff2',
			],
			[
				'recursive',
				'latin',
				'grad',
				'normal',
				0,
				'woff2',
				'recursive-latin-grad-normal.woff2',
			],
			// Different format (woff)
			[
				'inter',
				'latin',
				'wght',
				'normal',
				0,
				'woff',
				'inter-latin-wght-normal.woff',
			],
			// Sliced font (sliceIndex > 0)
			[
				'noto-sans-jp',
				'japanese',
				'wght',
				'normal',
				2,
				'woff2',
				'noto-sans-jp-japanese-wght-normal-2.woff2',
			],
			// Complex names, italic, slice index, and woff format
			[
				'source-code-pro',
				'latin-ext',
				'full',
				'italic',
				3,
				'woff',
				'source-code-pro-latin-ext-full-italic-3.woff',
			],
		])(
			'should correctly generate filename for %s-%s-%s-%s (slice %i, format %s)',
			(familyId, subset, axisKey, style, sliceIndex, format, expected) => {
				const filename = generateVariableFilename(
					familyId,
					subset,
					axisKey,
					style as FontStyle,
					sliceIndex,
					format as Format,
				);
				expect(filename).toBe(expected);
			},
		);
	});
});
