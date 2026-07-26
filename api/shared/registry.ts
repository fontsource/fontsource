import { z } from 'zod';

const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const TagIdSchema = z
	.string()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*\/[a-z0-9]+(?:-[a-z0-9]+)*$/);
const Sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);
const ClassificationSchema = z.enum([
	'serif',
	'sans-serif',
	'slab-serif',
	'display',
	'handwriting',
	'monospace',
	'symbols',
]);
const UnicodeRangeSchema = z.tuple([
	z.string().regex(/^[0-9A-F]+$/),
	z.string().regex(/^[0-9A-F]+$/),
]);

const AxisSchema = z.strictObject({
	tag: z.string().length(4),
	min: z.number(),
	max: z.number(),
	default: z.number(),
});

const WeightSchema = z.union([
	z.number(),
	z.strictObject({
		min: z.number(),
		max: z.number(),
		default: z.number(),
	}),
]);

const FamilySummarySchema = z.strictObject({
	id: IdSchema,
	family: z.string(),
	displayName: z.string().optional(),
	provider: IdSchema,
	status: z.enum(['active', 'deprecated']),
	classifications: z.array(ClassificationSchema).min(1),
	tags: z.array(TagIdSchema),
	sourceModified: z.iso.date(),
	declaredSubsets: z.array(IdSchema),
	variable: z.boolean(),
	axes: z.array(z.string().length(4)),
});

const RegistrySourceSchema = z.strictObject({
	sha256: Sha256Schema,
	filename: z.string().min(1),
	format: z.enum(['ttf', 'otf']),
	size: z.number().int().nonnegative(),
	downloadUrl: z.string().min(1).describe('Relative source download URL'),
	type: z.enum(['static', 'variable']),
	fontVersion: z.string().nullable(),
	weight: WeightSchema,
	style: z.enum(['normal', 'italic', 'oblique']),
	axes: z.array(AxisSchema),
});

const LocalizedContentSchema = z.strictObject({
	description: z.string().describe('Markdown family description').optional(),
	article: z.string().describe('Markdown family article').optional(),
});

export const RegistryInfoSchema = z.strictObject({
	familyCount: z.number().int().nonnegative(),
	subsetCount: z.number().int().nonnegative(),
});

export const RegistryFamiliesSchema = z.strictObject({
	families: z.array(FamilySummarySchema),
});

export const RegistryFamilyDetailSchema = FamilySummarySchema.omit({
	variable: true,
	axes: true,
}).extend({
	designer: z.string().optional(),
	dateAdded: z.iso.date().optional(),
	license: z.strictObject({
		id: z.string(),
		url: z.url(),
		attribution: z.string().optional(),
		text: z.string().describe('Complete license text').optional(),
	}),
	project: z
		.strictObject({
			repository: z.url(),
			revision: z.string().optional(),
		})
		.optional(),
	content: z.record(z.string().min(1), LocalizedContentSchema).optional(),
	sources: z.array(RegistrySourceSchema).min(1),
});

export const RegistrySubsetsSchema = z.strictObject({
	subsets: z.array(IdSchema),
});

export const RegistrySubsetSchema = z.strictObject({
	id: IdSchema,
	ranges: z.array(UnicodeRangeSchema),
	slices: z
		.array(
			z.strictObject({
				id: z.string(),
				ranges: z.array(UnicodeRangeSchema),
			}),
		)
		.optional(),
});

const AxisRegistryEntrySchema = z.strictObject({
	name: z.string(),
	description: z.string(),
	min: z.number(),
	max: z.number(),
	default: z.number(),
	precision: z.number(),
});

export const RegistryAxesSchema = z.strictObject({
	axes: z.record(z.string().length(4), AxisRegistryEntrySchema),
});

const TaxonomyLabelSchema = z.strictObject({ label: z.string().min(1) });

export const RegistryTaxonomySchema = z.strictObject({
	classifications: z.record(ClassificationSchema, TaxonomyLabelSchema),
	tagGroups: z.record(IdSchema, TaxonomyLabelSchema),
	tags: z.record(TagIdSchema, TaxonomyLabelSchema),
});

export const RegistrySourceParamSchema = z.object({
	sha256: Sha256Schema.describe('Archived source font SHA-256 digest'),
});

export const RegistryIdParamSchema = z.object({
	id: IdSchema.describe('Registry family or subset identifier'),
});
