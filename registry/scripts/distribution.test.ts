import { describe, expect, it } from 'vitest';
import {
	type Family,
	type FamilyDistribution,
	familyDistributionSchema,
} from './schema.ts';
import { compareStrings } from './shared.ts';
import { validateDistributionResolution } from './validator.ts';

describe('variant validation', () => {
	it('accepts a sparse static relation and rejects a phantom cross-product', () => {
		const revision = 'a'.repeat(40);
		const variants = [
			{ weight: 300, style: 'normal' },
			{ weight: 400, style: 'italic' },
		] as const;
		const files = variants
			.map((variant) => ({
				path: `ofl/neuton/Neuton-${variant.weight}-${variant.style}.ttf`,
				variant,
			}))
			.toSorted((left, right) => compareStrings(left.path, right.path));
		const family: Family = {
			family: 'Neuton',
			status: 'active',
			provenance: {
				type: 'github',
				repository: 'google/fonts',
				revision,
				directory: 'ofl/neuton',
			},
			classifications: ['serif'],
			tags: [],
			languages: [],
			sourceModified: '2026-01-02',
			license: { id: 'OFL-1.1', url: 'https://example.com/license' },
			sources: files.map((file) => ({
				path: file.path,
				sha256: '0'.repeat(64),
				size: 1,
				variant: file.variant,
				inspection: {
					fontVersion: 'Version 1.0',
					weight: file.variant.weight,
					style: file.variant.style,
					axes: [],
					outline: 'glyf',
					colorTables: [],
				},
			})),
		};
		const distribution: FamilyDistribution = {
			static: [...variants],
			defaultSubset: 'latin',
			subsets: [{ id: 'latin', definition: 'latin' }],
		};

		expect(() =>
			validateDistributionResolution(distribution, family, 'neuton'),
		).not.toThrow();
		expect(() =>
			validateDistributionResolution(
				{
					...distribution,
					static: [...variants, { weight: 300, style: 'italic' }],
				},
				family,
				'neuton',
			),
		).toThrow('neuton static 300 italic must resolve to one source');
	});

	it('accepts only canonical variable axis bundles published by Core', () => {
		const family: Family = {
			family: 'Example',
			status: 'active',
			provenance: { type: 'registry' },
			classifications: ['sans-serif'],
			tags: [],
			languages: [],
			sourceModified: '2026-01-02',
			license: { id: 'OFL-1.1', url: 'https://example.com/license' },
			sources: [
				{
					path: 'files/Example[wght].ttf',
					sha256: '0'.repeat(64),
					size: 1,
					variant: { weight: 400, style: 'normal' },
					inspection: {
						fontVersion: 'Version 1.0',
						weight: { min: 100, max: 900, default: 400 },
						style: 'normal',
						axes: [
							{ tag: 'ital', min: 0, max: 1, default: 0 },
							{ tag: 'MONO', min: 0, max: 1, default: 0 },
							{ tag: 'slnt', min: -15, max: 0, default: 0 },
							{ tag: 'wght', min: 100, max: 900, default: 400 },
						],
						outline: 'glyf',
						colorTables: [],
					},
				},
			],
		};
		const distribution: FamilyDistribution = {
			variable: [
				{ axisKey: 'full', style: 'italic' },
				{ axisKey: 'MONO', style: 'normal' },
				{ axisKey: 'standard', style: 'normal' },
				{ axisKey: 'wght', style: 'normal' },
			],
			defaultSubset: 'latin',
			subsets: [{ id: 'latin', definition: 'latin' }],
		};

		expect(() =>
			validateDistributionResolution(distribution, family, 'example'),
		).not.toThrow();
		expect(() =>
			validateDistributionResolution(
				{
					...distribution,
					variable: [{ axisKey: 'mono', style: 'normal' }],
				},
				family,
				'example',
			),
		).toThrow('example variable mono normal must resolve to one source');
		expect(
			familyDistributionSchema.safeParse({
				...distribution,
				variable: [{ axisKey: 'weight', style: 'normal' }],
			}).success,
		).toBe(false);
	});
});
