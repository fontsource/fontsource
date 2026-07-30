import { describe, expect, it } from 'vitest';
import type { Family, FamilyDistribution } from './schema.ts';
import { validateDistributionResolution } from './validator.ts';

const createFamily = (family: string, sources: Family['sources']): Family => ({
	family,
	status: 'active',
	provenance: { type: 'registry' },
	classifications: ['sans-serif'],
	tags: [],
	languages: [],
	sourceModified: '2026-01-02',
	license: { id: 'OFL-1.1', url: 'https://example.com/license' },
	sources,
});

describe('distribution resolution', () => {
	it('accepts a sparse static relation and rejects a phantom cross-product', () => {
		const variants = [
			{ weight: 300, style: 'normal' },
			{ weight: 400, style: 'italic' },
		] as const;
		const family = createFamily(
			'Neuton',
			variants.map((variant) => ({
				path: `ofl/neuton/Neuton-${variant.weight}-${variant.style}.ttf`,
				sha256: '0'.repeat(64),
				size: 1,
				variant,
				inspection: {
					fontVersion: 'Version 1.0',
					weight: variant.weight,
					style: variant.style,
					axes: [],
					outline: 'glyf',
					colorTables: [],
				},
			})),
		);
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
		const family = createFamily('Example', [
			{
				path: 'files/Example[wght].ttf',
				sha256: '0'.repeat(64),
				size: 1,
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
		]);
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
	});
});
