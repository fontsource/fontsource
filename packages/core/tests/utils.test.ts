import type { StyleValue } from '@glypht/core';
import { describe, expect, it } from 'vitest';
import {
	codepointsToRangeString,
	determineAxisKey,
	extractStyleValue,
	findClosestWeight,
	formatAxisValue,
	formatStretchValue,
	resolveFontFaces,
} from '../src/utils';

describe('codepointsToRangeString', () => {
	it('should return an empty string for an empty array', () => {
		expect(codepointsToRangeString([])).toBe('');
	});

	it('should correctly format a single codepoint', () => {
		expect(codepointsToRangeString([65])).toBe('U+41');
	});

	it('should group consecutive codepoints into a single range', () => {
		expect(codepointsToRangeString([65, 66, 67])).toBe('U+41-43');
	});

	it('should list non-consecutive codepoints separately', () => {
		expect(codepointsToRangeString([65, 67])).toBe('U+41, U+43');
	});

	it('should handle a complex mix of ranges and single codepoints', () => {
		expect(codepointsToRangeString([65, 66, 68, 70, 71, 72, 75])).toBe(
			'U+41-42, U+44, U+46-48, U+4B',
		);
	});

	it('should automatically sort and remove duplicate codepoints', () => {
		expect(codepointsToRangeString([67, 65, 66, 65])).toBe('U+41-43');
	});

	it('should handle large codepoints correctly', () => {
		expect(codepointsToRangeString([0x1f600, 0x1f601])).toBe('U+1F600-1F601');
	});
});

describe('extractStyleValue', () => {
	it('should return the number directly if the input is a number', () => {
		expect(extractStyleValue(1.5)).toBe(1.5);
	});

	it('should return the defaultValue if the input is an object', () => {
		const styleValue: StyleValue = {
			type: 'variable',
			value: { min: 100, defaultValue: 400, max: 900 },
		};
		expect(extractStyleValue(styleValue)).toBe(400);
	});
});

describe('variable axis helpers', () => {
	it('determineAxisKey respects explicit overrides and Fontsource axis bucketing', () => {
		expect(determineAxisKey({ wght: { min: 100, max: 900 } }, 'OPSZ')).toBe(
			'opsz',
		);
		expect(determineAxisKey({})).toBe('wght');
		expect(determineAxisKey({ XTRA: { min: 300, max: 700 } })).toBe('XTRA');
		expect(
			determineAxisKey({
				wght: { min: 100, max: 900 },
				wdth: { min: 75, max: 100 },
			}),
		).toBe('standard');
		expect(
			determineAxisKey({
				wght: { min: 100, max: 900 },
				XTRA: { min: 300, max: 700 },
			}),
		).toBe('full');
	});

	it('formats fixed and ranged axis values for CSS', () => {
		expect(formatAxisValue({ min: 400, max: 400 })).toBe('400');
		expect(formatAxisValue({ min: 100, max: 900 })).toBe('100 900');
		expect(formatStretchValue({ min: 100, max: 100 })).toBe('100%');
		expect(formatStretchValue({ min: 75, max: 125 })).toBe('75% 125%');
	});

	it('prefers the heavier weight when both weights are equally close to the target', () => {
		expect(findClosestWeight([300, 500], 400)).toBe(500);
	});
});

describe('resolveFontFaces', () => {
	it('resolves static and variable configs into canonical face records', () => {
		expect({
			static: resolveFontFaces({
				id: 'inter',
				family: 'Inter',
				subsets: ['latin'],
				weights: [400],
				styles: ['normal'],
				unicodeRange: { latin: 'U+0000-00FF' },
				formats: ['woff2', 'woff'],
			}),
			variable: resolveFontFaces({
				id: 'inter',
				family: 'Inter',
				subsets: ['latin'],
				weights: [],
				styles: ['italic'],
				unicodeRange: { latin: 'U+0000-00FF' },
				formats: ['woff2'],
				variable: {
					wght: { min: 100, max: 900 },
					wdth: { min: 75, max: 100 },
					XTRA: { min: 300, max: 700 },
				},
			}),
		}).toMatchSnapshot();
	});
});

describe('codepointsToRangeString snapshots', () => {
	it('should generate correct range for Latin Basic subset', () => {
		const latinBasic = Array.from({ length: 96 }, (_, i) => 32 + i);
		const result = codepointsToRangeString(latinBasic);
		expect(`Latin Basic subset codepoint range:\n${result}`).toMatchSnapshot();
	});

	it('should generate correct range for Latin Extended-A subset', () => {
		const latinExtendedA = Array.from({ length: 128 }, (_, i) => 256 + i);
		const result = codepointsToRangeString(latinExtendedA);
		expect(
			`Latin Extended-A subset codepoint range:\n${result}`,
		).toMatchSnapshot();
	});

	it('should generate correct range for typical Latin font subset', () => {
		const latinWebFont = [
			32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
			50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
			68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
			86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102,
			103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117,
			118, 119, 120, 121, 122, 123, 124, 125, 126, 160, 161, 162, 163, 164, 165,
			166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180,
			181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195,
			196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210,
			211, 212, 213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 224, 225,
			226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237, 238, 239, 240,
			241, 242, 243, 244, 245, 246, 247, 248, 249, 250, 251, 252, 253, 254, 255,
			256, 257, 258, 259, 260, 261, 8211, 8212, 8216, 8217, 8220, 8221, 8230,
			8364, 8482,
		];

		const result = codepointsToRangeString(latinWebFont);
		expect(
			`Typical Latin font subset codepoint range:\n${result}`,
		).toMatchSnapshot();
	});

	it('should generate correct range for sparse codepoint distribution', () => {
		const sparseCodepoints = [
			32, 33, 46, 65, 66, 67, 97, 98, 99, 36, 162, 163, 164, 165, 8364, 8592,
			8593, 8594, 9733, 9829, 65536, 65537, 131071, 131072,
		];
		const result = codepointsToRangeString(sparseCodepoints);
		expect(`Sparse codepoint distribution range:\n${result}`).toMatchSnapshot();
	});
});
