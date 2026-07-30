import { z } from 'zod';

// Zod is the single schema source for committed registry data.
const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const languageIdSchema = z
	.string()
	.regex(/^[a-z][a-z0-9]*(?:[-_][A-Za-z0-9]+)*$/);
export const familyProviderSchema = z.enum([
	'google',
	'google-icons',
	'fontsource',
]);
const revisionSchema = z.string().regex(/^[0-9a-f]{40}$/);
const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const dateSchema = z.iso.date();
const finiteNumberSchema = z.number().finite();
const fontStyleSchema = z.enum(['normal', 'italic']);
const scriptSchema = z.string().regex(/^[A-Z][a-z]{3}$/);
const unicodeScalarSchema = z
	.number()
	.int()
	.min(0)
	.max(0x10ffff)
	.refine((value) => value < 0xd800 || value > 0xdfff, {
		message: 'must not be a Unicode surrogate',
	});
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
const githubRepositorySchema = z
	.string()
	.regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/);

const sampleTextSchema = z
	.strictObject({
		styles: z.string().min(1).optional(),
		tester: z.string().min(1).optional(),
	})
	.refine((value) => value.styles || value.tester, {
		message: 'must contain styles or tester text',
	});

export const languageCatalogSchema = z.record(
	languageIdSchema,
	z.strictObject({
		language: z.string().min(1),
		script: scriptSchema,
		name: z.string().min(1),
		preferredName: z.string().min(1).optional(),
		autonym: z.string().min(1).optional(),
		sampleText: sampleTextSchema.optional(),
		requiredCodepoints: z.array(unicodeScalarSchema).min(1).optional(),
	}),
);

export const upstreamsSchema = z.strictObject({
	googleFonts: z.strictObject({
		repository: z.literal('google/fonts'),
		revision: revisionSchema,
	}),
	googleIcons: z.strictObject({
		repository: z.literal('google/material-design-icons'),
		revision: revisionSchema,
	}),
	namFiles: z.strictObject({
		repository: z.literal('googlefonts/nam-files'),
		revision: revisionSchema,
	}),
	fontFiles: z.strictObject({
		repository: z.literal('fontsource/font-files'),
		revision: revisionSchema,
	}),
});

export const replacementRegistrySchema = z.record(idSchema, idSchema);

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

const sourceInspectionSchema = z.strictObject({
	fontVersion: z.string().min(1).nullable(),
	weight: weightSchema,
	style: z.enum(['normal', 'italic', 'oblique']),
	axes: z.array(axisSchema),
	outline: z.enum(['glyf', 'cff', 'cff2', 'bitmap']),
	colorTables: z.array(z.string().length(4)),
});

export const familySchema = z.strictObject({
	family: z.string().min(1),
	status: z.enum(['active', 'deprecated']),
	provenance: z.discriminatedUnion('type', [
		z.strictObject({
			type: z.literal('github'),
			repository: githubRepositorySchema,
			revision: revisionSchema,
			directory: sourcePathSchema,
		}),
		z.strictObject({ type: z.literal('registry') }),
	]),
	displayName: z.string().min(1).optional(),
	classifications: classificationsSchema,
	tags: z.array(tagIdSchema).default([]),
	languages: z.array(languageIdSchema),
	primaryLanguage: languageIdSchema.optional(),
	primaryScript: scriptSchema.optional(),
	sampleText: sampleTextSchema.optional(),
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
	sources: z
		.array(sourceFileSchema.extend({ inspection: sourceInspectionSchema }))
		.min(1),
});

export const familyIconsSchema = z.strictObject({
	icons: z
		.array(
			z.strictObject({
				name: z.string().min(1).regex(/^\S+$/),
				codepoint: unicodeScalarSchema,
			}),
		)
		.min(1),
	source: z.strictObject({
		revision: revisionSchema,
		path: sourcePathSchema,
		sha256: sha256Schema,
	}),
});

export const sourceFamilySchema = familySchema
	.omit({
		status: true,
		provenance: true,
		sourceModified: true,
		sources: true,
	})
	.extend({
		id: idSchema,
		languages: familySchema.shape.languages.optional(),
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

export type Family = z.infer<typeof familySchema>;
export type FamilyProvider = z.infer<typeof familyProviderSchema>;
export type FamilySource = Family['sources'][number];
export type FamilyIcons = z.infer<typeof familyIconsSchema>;
export type FamilyPolicy = z.infer<typeof familyPolicySchema>;
export type LanguageCatalog = z.infer<typeof languageCatalogSchema>;
export type ReplacementRegistry = z.infer<typeof replacementRegistrySchema>;
export type SourceFamily = z.infer<typeof sourceFamilySchema>;
export type SubsetDefinition = z.infer<typeof subsetDefinitionSchema>;
export type Taxonomy = z.infer<typeof taxonomySchema>;
