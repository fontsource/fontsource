import { z } from 'zod';

// Zod is the single schema source for committed registry data.
const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const familyProviderSchema = z.enum(['google', 'fontsource']);
const familyKeySchema = z
	.string()
	.regex(/^(?:google|fontsource)\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
const revisionSchema = z.string().regex(/^[0-9a-f]{40}$/);
const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const dateSchema = z.iso.date();
const finiteNumberSchema = z.number().finite();
const fontStyleSchema = z.enum(['normal', 'italic']);
export const fontClassificationSchema = z.enum([
	'serif',
	'sans-serif',
	'slab-serif',
	'display',
	'handwriting',
	'monospace',
	'symbols',
]);
const tagIdSchema = z
	.string()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
const classificationsSchema = z
	.array(fontClassificationSchema)
	.min(1)
	.refine(
		(values) =>
			values.filter((value) =>
				['serif', 'sans-serif', 'slab-serif'].includes(value),
			).length <= 1,
		{ message: 'must not contain conflicting serif classifications' },
	);
const staticVariantSchema = z.strictObject({
	weight: z.number().int().min(1).max(1000),
	style: fontStyleSchema,
});
const sourcePathSchema = z
	.string()
	.min(1)
	.refine(
		(value) =>
			!value.startsWith('/') &&
			!value.includes('\\') &&
			!value.split('/').includes('..'),
		{ message: 'must be a safe repository-relative POSIX path' },
	);

export const registryIndexSchema = z.strictObject({
	schemaVersion: z.literal(1),
	upstreams: z.strictObject({
		googleFonts: z.strictObject({
			repository: z.literal('google/fonts'),
			revision: revisionSchema,
		}),
		namFiles: z.strictObject({
			repository: z.literal('googlefonts/nam-files'),
			revision: revisionSchema,
		}),
	}),
	families: z.array(familyKeySchema),
	subsets: z.array(idSchema),
});

const archivedFileSchema = z.strictObject({
	path: sourcePathSchema,
	size: z.number().int().nonnegative(),
	sha256: sha256Schema,
});

export const archiveManifestSchema = z.strictObject({
	schemaVersion: z.literal(1),
	registryRevision: revisionSchema,
	registry: z.array(archivedFileSchema),
	views: z.array(archivedFileSchema),
	sources: z.array(
		z.strictObject({
			size: z.number().int().nonnegative(),
			sha256: sha256Schema,
		}),
	),
});

const sourceFileSchema = z.strictObject({
	path: sourcePathSchema.refine((path) => /\.(?:otf|ttf)$/i.test(path), {
		message: 'must be a TTF or OTF',
	}),
	sha256: sha256Schema,
	size: z.number().int().nonnegative(),
	variant: staticVariantSchema.optional(),
});

export const familyMetadataSchema = z.strictObject({
	id: idSchema,
	family: z.string().min(1),
	provider: familyProviderSchema,
	status: z.enum(['active', 'deprecated']),
	provenance: z.discriminatedUnion('type', [
		z.strictObject({
			type: z.literal('github'),
			repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
			revision: revisionSchema,
			directory: sourcePathSchema,
		}),
		z.strictObject({ type: z.literal('registry') }),
	]),
	displayName: z.string().min(1).optional(),
	classifications: classificationsSchema,
	tags: z.array(tagIdSchema).default([]),
	designer: z.string().min(1).optional(),
	dateAdded: dateSchema.optional(),
	sourceModified: dateSchema,
	license: z.strictObject({
		id: z.string().min(1),
		url: z.url({ protocol: /^https$/ }),
		attribution: z.string().min(1).optional(),
	}),
	project: z
		.strictObject({
			repository: z.url({ protocol: /^https$/ }),
			revision: z.string().min(1).optional(),
		})
		.optional(),
	declaredSubsets: z.array(idSchema),
	sourceFiles: z.array(sourceFileSchema).min(1),
});

export const sourceFamilySchema = familyMetadataSchema
	.omit({
		provider: true,
		status: true,
		provenance: true,
		sourceModified: true,
		sourceFiles: true,
	})
	.extend({
		sourceFiles: z
			.array(
				z.strictObject({
					path: sourcePathSchema.refine(
						(path) => /^files\/.+\.(?:otf|ttf)$/i.test(path),
						{ message: 'must be a TTF or OTF under files/' },
					),
					variant: staticVariantSchema.optional(),
				}),
			)
			.min(1),
	});

const axisSchema = z.strictObject({
	tag: z.string().length(4),
	min: finiteNumberSchema,
	max: finiteNumberSchema,
	default: finiteNumberSchema,
});

const weightSchema = z.union([
	finiteNumberSchema,
	z.strictObject({
		min: finiteNumberSchema,
		max: finiteNumberSchema,
		default: finiteNumberSchema,
	}),
]);

export const familyInspectionSchema = z.strictObject({
	files: z.array(
		z.strictObject({
			path: sourcePathSchema,
			fontVersion: z.string().min(1).nullable(),
			weight: weightSchema,
			style: z.enum(['normal', 'italic', 'oblique']),
			axes: z.array(axisSchema),
			cmap: z.strictObject({
				codepointCount: z.number().int().nonnegative(),
				sha256: sha256Schema,
			}),
			outline: z.enum(['glyf', 'cff', 'cff2', 'bitmap']),
			colorTables: z.array(z.string().length(4)),
		}),
	),
});

const variableVariantSchema = z.strictObject({
	axisKey: z.string().min(1),
	style: fontStyleSchema,
});

export const familyPolicySchema = z.strictObject({
	packages: z.strictObject({
		static: z
			.strictObject({ variants: z.array(staticVariantSchema).min(1) })
			.optional(),
		variable: z
			.strictObject({ variants: z.array(variableVariantSchema).min(1) })
			.optional(),
	}),
	defaultSubset: idSchema,
	subsets: z
		.array(z.strictObject({ id: idSchema, definition: idSchema }))
		.min(1),
});

const rangeSchema = z.tuple([
	z.string().regex(/^[0-9A-F]+$/),
	z.string().regex(/^[0-9A-F]+$/),
]);

export const subsetDefinitionSchema = z.strictObject({
	id: idSchema,
	ranges: z.array(rangeSchema),
	slices: z
		.array(
			z.strictObject({
				id: z.string().regex(/^[1-9]\d*$/),
				ranges: z.array(rangeSchema),
			}),
		)
		.optional(),
	source: z.strictObject({
		upstream: z.literal('namFiles'),
		revision: revisionSchema,
		path: sourcePathSchema,
		sha256: sha256Schema,
	}),
});

export const axisRegistrySchema = z.record(
	z.string().length(4),
	z.strictObject({
		name: z.string().min(1),
		description: z.string(),
		min: finiteNumberSchema,
		max: finiteNumberSchema,
		default: finiteNumberSchema,
		precision: z.number().int(),
	}),
);

const labelSchema = z.strictObject({ label: z.string().min(1) });

export const taxonomySchema = z.strictObject({
	classifications: z.record(fontClassificationSchema, labelSchema),
	tagGroups: z.record(idSchema, labelSchema),
	tags: z.record(tagIdSchema, labelSchema),
});

export type FamilyMetadata = z.infer<typeof familyMetadataSchema>;
export type FamilyInspection = z.infer<typeof familyInspectionSchema>;
export type FamilyPolicy = z.infer<typeof familyPolicySchema>;
export type SourceFamily = z.infer<typeof sourceFamilySchema>;
export type SubsetDefinition = z.infer<typeof subsetDefinitionSchema>;
export type Taxonomy = z.infer<typeof taxonomySchema>;
