import { validateStrict } from 'compare-versions';
import { z } from 'zod';
import { PackageOutputSchema } from './package-output';
import { RegistryFamilyDetailSchema, RegistryIdParamSchema } from './registry';

// Publication advances independently of source registry snapshots.
export const PackageVersionSchema = z
	.string()
	.refine(validateStrict, 'Expected an exact package version');
export const PackageKindSchema = z.enum(['static', 'variable']);
export const PublishedPackagesSchema = z
	.record(
		RegistryIdParamSchema.shape.id,
		z
			.object({
				static: PackageVersionSchema.optional(),
				variable: PackageVersionSchema.optional(),
			})
			.refine(
				(entry) => entry.static || entry.variable,
				'Expected a published package',
			),
	)
	.refine(
		(packages) => Object.keys(packages).length > 0,
		'Expected a nonempty publication index',
	);
export type PublishedPackages = z.infer<typeof PublishedPackagesSchema>;
export const PublishedPackageOutputSchema = z.object({
	id: RegistryIdParamSchema.shape.id,
	kind: PackageKindSchema,
	version: PackageVersionSchema,
	manifest: PackageOutputSchema,
	metadata: RegistryFamilyDetailSchema,
});
