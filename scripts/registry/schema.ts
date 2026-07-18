import { z } from 'zod';

// Zod is the single schema source for committed registry data.
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const revision = z.string().regex(/^[0-9a-f]{40}$/);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const finite = z.number().finite();
const staticVariantSchema = z.strictObject({
	weight: z.number().int().min(1).max(1000),
	style: z.enum(['normal', 'italic']),
});
const sourcePath = z
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
			revision,
		}),
		namFiles: z.strictObject({
			repository: z.literal('googlefonts/nam-files'),
			revision,
		}),
	}),
	families: z.array(id),
	subsets: z.array(id),
});

const sourceFileSchema = z.strictObject({
	path: sourcePath,
	sha256,
	size: z.number().int().nonnegative(),
	variant: staticVariantSchema.optional(),
});

export const familyMetadataSchema = z.strictObject({
	id,
	family: z.string().min(1),
	displayName: z.string().min(1).optional(),
	category: z.enum([
		'sans-serif',
		'serif',
		'display',
		'handwriting',
		'monospace',
		'icons',
		'other',
	]),
	designer: z.string().min(1).optional(),
	dateAdded: date.optional(),
	sourceModified: date,
	license: z.strictObject({
		id: z.string().min(1),
		url: z.url({ protocol: /^https$/ }),
		attribution: z.string().min(1).optional(),
	}),
	origin: z.strictObject({
		upstream: z.literal('googleFonts'),
		revision,
		directory: sourcePath,
		available: z.boolean(),
	}),
	project: z
		.strictObject({
			repository: z.url({ protocol: /^https$/ }),
			revision: z.string().min(1).optional(),
		})
		.optional(),
	declaredSubsets: z.array(id),
	sourceFiles: z.array(sourceFileSchema).min(1),
});

const axisSchema = z.strictObject({
	tag: z.string().length(4),
	min: finite,
	max: finite,
	default: finite,
});

const weightSchema = z.union([
	finite,
	z.strictObject({ min: finite, max: finite, default: finite }),
]);

export const familyInspectionSchema = z.strictObject({
	files: z.array(
		z.strictObject({
			path: sourcePath,
			fontVersion: z.string().min(1).nullable(),
			weight: weightSchema,
			style: z.enum(['normal', 'italic', 'oblique']),
			axes: z.array(axisSchema),
			cmap: z.strictObject({
				codepointCount: z.number().int().nonnegative(),
				sha256,
			}),
			outline: z.enum(['glyf', 'cff', 'cff2', 'bitmap']),
			colorTables: z.array(z.string().length(4)),
		}),
	),
});

const variableVariantSchema = z.strictObject({
	axisKey: z.string().min(1),
	style: z.enum(['normal', 'italic']),
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
	defaultSubset: id,
	subsets: z.array(z.strictObject({ id, definition: id })).min(1),
});

const rangeSchema = z.tuple([
	z.string().regex(/^[0-9A-F]+$/),
	z.string().regex(/^[0-9A-F]+$/),
]);

export const subsetDefinitionSchema = z.strictObject({
	id,
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
		revision,
		path: sourcePath,
		sha256,
	}),
});

export const axisRegistrySchema = z.record(
	z.string().length(4),
	z.strictObject({
		name: z.string().min(1),
		description: z.string(),
		min: finite,
		max: finite,
		default: finite,
		precision: z.number().int(),
	}),
);

export type FamilyMetadata = z.infer<typeof familyMetadataSchema>;
export type FamilyInspection = z.infer<typeof familyInspectionSchema>;
export type FamilyPolicy = z.infer<typeof familyPolicySchema>;
export type SubsetDefinition = z.infer<typeof subsetDefinitionSchema>;
