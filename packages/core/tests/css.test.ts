import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SubsetName } from '@glypht/core';
import { describe, expect, it } from 'vitest';
import { generateStaticCSS, generateVariableCSS } from '../src/css';
import type {
	FontStyle,
	ProcessedVariant,
	SubsetDefinition,
} from '../src/types';

const snapshotDir = resolve(
	fileURLToPath(import.meta.url),
	'../__snapshots__/css',
);

describe('generate static css', () => {
	const mockVariants: ProcessedVariant[] = [
		// 400 normal (latin, with multiple formats)
		{
			type: 'static',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-400-normal.woff2',
			content: new Uint8Array([1]),
		},
		{
			type: 'static',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-400-normal.woff',
			content: new Uint8Array([2]),
		},
		// 400 normal (latin-ext)
		{
			type: 'static',
			weight: 400,
			style: 'normal',
			subset: 'latin-ext' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-ext-400-normal.woff2',
			content: new Uint8Array([3]),
		},
		// 400 normal (japanese, sliced)
		{
			type: 'static',
			weight: 400,
			style: 'normal',
			subset: 'japanese' as SubsetName,
			sliceIndex: 1,
			filename: 'inter-japanese-400-normal-1.woff2',
			content: new Uint8Array([4]),
		},
		{
			type: 'static',
			weight: 400,
			style: 'normal',
			subset: 'japanese' as SubsetName,
			sliceIndex: 2,
			filename: 'inter-japanese-400-normal-2.woff2',
			content: new Uint8Array([5]),
		},
		// 700 normal (bold)
		{
			type: 'static',
			weight: 700,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-700-normal.woff2',
			content: new Uint8Array([6]),
		},
		// 400 italic
		{
			type: 'static',
			weight: 400,
			style: 'italic',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-400-italic.woff2',
			content: new Uint8Array([7]),
		},
		// 400 oblique
		{
			type: 'static',
			weight: 400,
			style: 'oblique 15deg',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-400-italic.woff2',
			content: new Uint8Array([8]),
		},
		// 700 oblique (decimal)
		{
			type: 'static',
			weight: 700,
			style: 'oblique 12.5deg',
			subset: 'latin-ext' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-ext-700-italic.woff2',
			content: new Uint8Array([9]),
		},
	];

	const mockSubsets = new Map<SubsetName, SubsetDefinition>([
		[
			'latin' as SubsetName,
			{
				name: 'latin' as SubsetName,
				type: 'range',
				unicodeRange: 'U+0000-00FF',
				codepoints: [],
			},
		],
		[
			'latin-ext' as SubsetName,
			{
				name: 'latin-ext' as SubsetName,
				type: 'range',
				unicodeRange: 'U+0100-024F',
				codepoints: [],
			},
		],
		[
			'japanese' as SubsetName,
			{
				name: 'japanese' as SubsetName,
				type: 'sliced',
				slices: [
					{ index: 1, codepoints: [12353, 12354] },
					{ index: 2, codepoints: [12356, 12357] },
				],
			},
		],
	]);

	it('should generate comprehensive CSS for a variant, handling multiple subsets, slices, and font formats', async () => {
		const css = generateStaticCSS(
			'Inter',
			400,
			'normal',
			mockVariants,
			mockSubsets,
		);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'static-comprehensive.css'),
		);
	});

	it.each([
		{ weight: 700, style: 'normal', case: 'bold' },
		{ weight: 400, style: 'italic', case: 'italic' },
		{ weight: 400, style: 'oblique 15deg', case: 'oblique-integer' },
		{ weight: 700, style: 'oblique 12.5deg', case: 'oblique-decimal' },
	])(
		'should generate correct CSS for $case variants',
		async ({ weight, style, case: caseName }) => {
			const css = generateStaticCSS(
				'Inter',
				weight,
				style as FontStyle,
				mockVariants,
				mockSubsets,
			);
			const snapshotPath = resolve(snapshotDir, `static-${caseName}.css`);
			await expect(css).toMatchFileSnapshot(snapshotPath);
		},
	);

	describe('edge cases', () => {
		it('should return an empty string for a non-existent weight/style combination', () => {
			const css = generateStaticCSS(
				'Inter',
				999,
				'normal',
				mockVariants,
				mockSubsets,
			);

			expect(css).toBe('');
		});

		it('should return an empty string if the variants array is empty', () => {
			const css = generateStaticCSS('Inter', 400, 'normal', [], mockSubsets);
			expect(css).toBe('');
		});

		it('should return an empty string if the subsets map is empty', () => {
			const css = generateStaticCSS(
				'Inter',
				400,
				'normal',
				mockVariants,
				new Map(),
			);
			expect(css).toBe('');
		});

		it('should skip variants if their subset definition is missing', () => {
			const variantsWithMissingSubset: ProcessedVariant[] = [
				{
					type: 'static',
					weight: 400,
					style: 'normal',
					subset: 'nonexistent' as SubsetName,
					sliceIndex: 0,
					filename: 'font.woff2',
					content: new Uint8Array([1]),
				},
			];
			const css = generateStaticCSS(
				'Inter',
				400,
				'normal',
				variantsWithMissingSubset,
				mockSubsets,
			);

			expect(css).toBe('');
		});
	});
});

describe('generate variable css', () => {
	const mockVariableVariants: ProcessedVariant[] = [
		// Standard variable font (wght only)
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-variable.woff2',
			content: new Uint8Array([10]),
			variable: {
				wght: { min: 100, max: 900 },
			},
			axisKey: 'wght',
		},
		// Full variable font with multiple axes
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-variable-full.woff2',
			content: new Uint8Array([11]),
			variable: {
				wght: { min: 100, max: 900 },
				slnt: { min: -15, max: 0 },
				wdth: { min: 75, max: 125 },
			},
			axisKey: 'full',
		},
		// Variable font with slant only
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'latin-ext' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-ext-variable-slnt.woff2',
			content: new Uint8Array([12]),
			variable: {
				slnt: { min: -10, max: 10 },
			},
			axisKey: 'slnt',
		},
		// Variable font with fixed slant value
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-variable-italic.woff2',
			content: new Uint8Array([13]),
			variable: {
				wght: { min: 400, max: 700 },
				slnt: { min: -12, max: -12 },
			},
			axisKey: 'standard',
		},
		// Variable font with width only
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-variable-wdth.woff2',
			content: new Uint8Array([14]),
			variable: {
				wdth: { min: 50, max: 150 },
			},
			axisKey: 'wdth',
		},
		// Sliced variable font (japanese)
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'japanese' as SubsetName,
			sliceIndex: 1,
			filename: 'inter-japanese-variable-1.woff2',
			content: new Uint8Array([15]),
			variable: {
				wght: { min: 300, max: 800 },
			},
			axisKey: 'wght',
		},
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'japanese' as SubsetName,
			sliceIndex: 2,
			filename: 'inter-japanese-variable-2.woff2',
			content: new Uint8Array([16]),
			variable: {
				wght: { min: 300, max: 800 },
			},
			axisKey: 'wght',
		},
		// Variable font with multiple formats
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-variable-multi.woff2',
			content: new Uint8Array([17]),
			variable: {
				wght: { min: 400, max: 600 },
			},
			axisKey: 'wght',
		},
		{
			type: 'variable',
			weight: 400,
			style: 'normal',
			subset: 'latin' as SubsetName,
			sliceIndex: 0,
			filename: 'inter-latin-variable-multi.woff',
			content: new Uint8Array([18]),
			variable: {
				wght: { min: 400, max: 600 },
			},
			axisKey: 'wght',
		},
	];

	const mockSubsets = new Map<SubsetName, SubsetDefinition>([
		[
			'latin' as SubsetName,
			{
				name: 'latin' as SubsetName,
				type: 'range',
				unicodeRange: 'U+0000-00FF',
				codepoints: [],
			},
		],
		[
			'latin-ext' as SubsetName,
			{
				name: 'latin-ext' as SubsetName,
				type: 'range',
				unicodeRange: 'U+0100-024F',
				codepoints: [],
			},
		],
		[
			'japanese' as SubsetName,
			{
				name: 'japanese' as SubsetName,
				type: 'sliced',
				slices: [
					{ index: 1, codepoints: [12353, 12354] },
					{ index: 2, codepoints: [12356, 12357] },
				],
			},
		],
	]);

	it('should generate comprehensive CSS for variable fonts with all axis combinations', async () => {
		const css = generateVariableCSS('Inter', mockVariableVariants, mockSubsets);
		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'variable-comprehensive.css'),
		);
	});

	it.each([
		{
			name: 'weight axis only',
			variable: { wght: { min: 100, max: 900 } },
			axisKey: 'wght',
			filename: 'testfont-latin-wght-normal.woff2',
		},
		{
			name: 'weight and slant axes',
			variable: { wght: { min: 400, max: 700 }, slnt: { min: -15, max: 0 } },
			axisKey: 'standard',
			filename: 'testfont-latin-standard-italic.woff2',
		},
		{
			name: 'fixed slant value',
			variable: {
				wght: { min: 300, max: 600 },
				slnt: { min: -12, max: -12 },
			},
			axisKey: 'standard',
			filename: 'testfont-latin-standard-italic.woff2',
		},
		{
			name: 'slant axis only',
			variable: { slnt: { min: -10, max: 10 } },
			axisKey: 'slnt',
			filename: 'testfont-latin-slnt-italic.woff2',
		},
		{
			name: 'width axis only',
			variable: { wdth: { min: 75, max: 125 } },
			axisKey: 'wdth',
			filename: 'testfont-latin-wdth-normal.woff2',
		},
		{
			name: 'fixed width value',
			variable: { wdth: { min: 100, max: 100 } },
			axisKey: 'wdth',
			filename: 'testfont-latin-wdth-normal.woff2',
		},
	])(
		'should generate correct CSS for variable fonts with $name',
		async ({ name, variable, axisKey, filename }) => {
			const variants: ProcessedVariant[] = [
				{
					type: 'variable',
					weight: 400,
					style: 'normal',
					subset: 'latin' as SubsetName,
					sliceIndex: 0,
					filename,
					content: new Uint8Array([1]),
					variable,
					axisKey,
				},
			];

			const css = generateVariableCSS('TestFont', variants, mockSubsets);
			const snapshotPath = resolve(
				snapshotDir,
				`variable-${name.replace(/\s+/g, '-').toLowerCase()}.css`,
			);
			await expect(css).toMatchFileSnapshot(snapshotPath);
		},
	);

	it('should handle variable fonts with multiple formats correctly', async () => {
		const multiFormatVariants = mockVariableVariants.filter((v) =>
			v.filename.includes('multi'),
		);

		const css = generateVariableCSS('Inter', multiFormatVariants, mockSubsets);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'variable-multiple-formats.css'),
		);
	});

	it('should handle sliced variable fonts correctly', async () => {
		const slicedVariants = mockVariableVariants.filter(
			(v) => v.subset === 'japanese',
		);

		const css = generateVariableCSS('Inter', slicedVariants, mockSubsets);

		await expect(css).toMatchFileSnapshot(
			resolve(snapshotDir, 'variable-sliced.css'),
		);
	});

	describe('edge cases variable', () => {
		it('should return an empty string if no variable variants are provided', () => {
			const css = generateVariableCSS('Inter', [], mockSubsets);
			expect(css).toBe('');
		});

		it('should return an empty string if only static variants are provided', () => {
			const staticVariants: ProcessedVariant[] = [
				{
					type: 'static',
					weight: 400,
					style: 'normal',
					subset: 'latin' as SubsetName,
					sliceIndex: 0,
					filename: 'static.woff2',
					content: new Uint8Array([1]),
				},
			];

			const css = generateVariableCSS('Inter', staticVariants, mockSubsets);
			expect(css).toBe('');
		});

		it('should return an empty string if the subsets map is empty', () => {
			const css = generateVariableCSS('Inter', mockVariableVariants, new Map());
			expect(css).toBe('');
		});

		it('should skip variable variants if their subset definition is missing', () => {
			const variantsWithMissingSubset: ProcessedVariant[] = [
				{
					type: 'variable',
					weight: 400,
					style: 'normal',
					subset: 'nonexistent' as SubsetName,
					sliceIndex: 0,
					filename: 'missing-subset.woff2',
					content: new Uint8Array([1]),
					variable: { wght: { min: 400, max: 700 } },
					axisKey: 'wght',
				},
			];

			const css = generateVariableCSS(
				'Inter',
				variantsWithMissingSubset,
				mockSubsets,
			);
			expect(css).toBe('');
		});

		it('should handle variable fonts with no axis configuration', async () => {
			const noAxisVariants: ProcessedVariant[] = [
				{
					type: 'variable',
					weight: 400,
					style: 'normal',
					subset: 'latin' as SubsetName,
					sliceIndex: 0,
					filename: 'no-axis.woff2',
					content: new Uint8Array([1]),
					variable: {},
					axisKey: 'none',
				},
			];

			const css = generateVariableCSS('Inter', noAxisVariants, mockSubsets);

			await expect(css).toMatchFileSnapshot(
				resolve(snapshotDir, 'variable-no-axis.css'),
			);
		});
	});
});
