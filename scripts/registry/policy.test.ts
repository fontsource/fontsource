import { describe, expect, it } from 'vitest';
import type {
	FamilyInspection,
	FamilyMetadata,
	FamilyPolicy,
} from './schema.ts';
import { compareStrings } from './shared.ts';
import { validatePolicyResolution } from './validator.ts';

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
		const metadata: FamilyMetadata = {
			id: 'neuton',
			family: 'Neuton',
			category: 'serif',
			sourceModified: '2026-01-02',
			license: { id: 'OFL-1.1', url: 'https://example.com/license' },
			origin: {
				upstream: 'googleFonts',
				revision,
				directory: 'ofl/neuton',
				available: true,
			},
			declaredSubsets: ['latin'],
			sourceFiles: files.map((file) => ({
				path: file.path,
				sha256: '0'.repeat(64),
				size: 1,
				variant: file.variant,
			})),
		};
		const inspection: FamilyInspection = {
			files: files.map((file) => ({
				path: file.path,
				fontVersion: 'Version 1.0',
				weight: file.variant.weight,
				style: file.variant.style,
				axes: [],
				cmap: { codepointCount: 95, sha256: '1'.repeat(64) },
				outline: 'glyf',
				colorTables: [],
			})),
		};
		const policy: FamilyPolicy = {
			packages: { static: { variants: [...variants] } },
			defaultSubset: 'latin',
			subsets: [{ id: 'latin', definition: 'latin' }],
		};

		expect(() =>
			validatePolicyResolution(policy, metadata, inspection, 'neuton'),
		).not.toThrow();
		expect(() =>
			validatePolicyResolution(
				{
					...policy,
					packages: {
						static: {
							variants: [...variants, { weight: 300, style: 'italic' }],
						},
					},
				},
				metadata,
				inspection,
				'neuton',
			),
		).toThrow('neuton static 300 italic must resolve to one source');
	});
});
