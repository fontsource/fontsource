import { z } from 'zod';

const IdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const LanguageIdSchema = z
	.string()
	.regex(/^[a-z][a-z0-9]*(?:[-_][A-Za-z0-9]+)*$/);
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
const UnicodeScalarSchema = z
	.number()
	.int()
	.min(0)
	.max(0x10ffff)
	.refine((value) => value < 0xd800 || value > 0xdfff);
const ScriptSchema = z.string().regex(/^[A-Z][a-z]{3}$/);
const SymbolInputModeSchema = z.enum(['codepoint', 'name-ligature']);

const SampleTextSchema = z.strictObject({
	short: z.string().min(1).describe('Compact preview text'),
	long: z.string().min(1).describe('Extended preview text').optional(),
});

const RangeShape = {
	min: z.number(),
	max: z.number(),
	default: z.number(),
};

const AxisSchema = z.strictObject({
	tag: z.string().length(4),
	...RangeShape,
});

const WeightSchema = z.union([z.number().finite(), z.strictObject(RangeShape)]);
const DeclaredVariantSchema = z.strictObject({
	weight: z.number().int().min(1).max(1000),
	style: z.enum(['normal', 'italic']),
});
const VariableDistributionSchema = z.strictObject({
	axisKey: z.union([z.literal('standard'), z.string().length(4)]),
	style: z.enum(['normal', 'italic']),
	source: Sha256Schema,
});
const CharacterDistributionSchema = z.discriminatedUnion('type', [
	z.strictObject({ type: z.literal('all') }),
	z.strictObject({
		type: z.literal('subsets'),
		defaultSubset: IdSchema,
		subsets: z
			.array(z.strictObject({ id: IdSchema, definition: IdSchema }))
			.min(1),
		slicing: IdSchema.optional(),
	}),
]);
const RegistryDistributionSchema = z
	.strictObject({
		static: z
			.array(DeclaredVariantSchema.extend({ source: Sha256Schema }))
			.min(1)
			.optional(),
		variable: z.array(VariableDistributionSchema).min(1).optional(),
		characters: CharacterDistributionSchema,
	})
	.refine((value) => value.static || value.variable, {
		message: 'must declare static or variable outputs',
	});

const FamilySummarySchema = z.strictObject({
	id: IdSchema,
	family: z.string(),
	displayName: z.string().optional(),
	provider: IdSchema,
	status: z.enum(['active', 'deprecated']),
	replacedBy: IdSchema.optional(),
	classifications: z.array(ClassificationSchema).min(1),
	tags: z.array(TagIdSchema),
	sourceModified: z.iso.date(),
	axes: z.array(z.string().length(4)),
});

const SourceCommonShape = {
	sha256: Sha256Schema,
	filename: z.string().min(1),
	format: z.enum(['ttf', 'otf']),
	size: z.number().int().nonnegative(),
	downloadUrl: z.string().min(1).describe('Relative source download URL'),
	capabilitiesUrl: z
		.string()
		.min(1)
		.describe('Relative source capabilities URL'),
	fontVersion: z.string().nullable(),
	style: z
		.enum(['normal', 'italic', 'oblique'])
		.describe('Inspected font style'),
	declaredVariant: DeclaredVariantSchema.optional().describe(
		'Provider-declared weight and style',
	),
};

const RegistrySourceSchema = z.discriminatedUnion('type', [
	z.strictObject({
		...SourceCommonShape,
		type: z.literal('static'),
		weight: z.number().finite().describe('Inspected font weight'),
	}),
	z.strictObject({
		...SourceCommonShape,
		type: z.literal('variable'),
		weight: WeightSchema.describe('Inspected font weight or range'),
		axes: z.array(AxisSchema).min(1),
	}),
]);

const LocalizedContentSchema = z.strictObject({
	description: z.string().describe('Markdown family description').optional(),
	article: z.string().describe('Markdown family article').optional(),
});

export const RegistryFamiliesSchema = z.array(FamilySummarySchema);

export const RegistryFamilyDetailSchema = FamilySummarySchema.extend({
	languages: z
		.array(LanguageIdSchema)
		.describe('Semantic language IDs, distinct from package subsets'),
	primaryLanguage: LanguageIdSchema.optional(),
	primaryScript: ScriptSchema.optional(),
	previewSubset: IdSchema.optional().describe(
		'Reviewed package subset for previews and default acquisition',
	),
	sampleText: SampleTextSchema.optional(),
	designer: z.string().optional(),
	dateAdded: z.iso.date().optional(),
	license: z.strictObject({
		id: z.string(),
		url: z.url(),
		attribution: z.string().optional(),
		text: z.string().min(1).describe('Complete license text'),
	}),
	project: z
		.strictObject({
			repository: z.url(),
			revision: z.string().optional(),
		})
		.optional(),
	content: z.record(z.string().min(1), LocalizedContentSchema).optional(),
	symbols: z
		.strictObject({
			catalogUrl: z.string().min(1),
			inputModes: z.array(SymbolInputModeSchema).min(1),
		})
		.optional(),
	sources: z.array(RegistrySourceSchema).min(1),
	previewSource: Sha256Schema.describe(
		'Distributed source selected for default previews and source-scoped capability inspection',
	),
	distribution: RegistryDistributionSchema,
}).superRefine((family, context) => {
	const sourceExists = family.sources.some(
		(source) => source.sha256 === family.previewSource,
	);
	const isDistributed = [
		...(family.distribution.static ?? []),
		...(family.distribution.variable ?? []),
	].some((variant) => variant.source === family.previewSource);
	if (!sourceExists || !isDistributed) {
		context.addIssue({
			code: 'custom',
			message: 'previewSource must reference a distributed source',
			path: ['previewSource'],
		});
	}
	if (family.previewSubset) {
		if (
			family.distribution.characters.type !== 'subsets' ||
			!family.distribution.characters.subsets.some(
				(subset) => subset.id === family.previewSubset,
			)
		) {
			context.addIssue({
				code: 'custom',
				message: 'previewSubset must reference a distributed subset',
				path: ['previewSubset'],
			});
		}
	}
});

export const RegistryFamilySymbolsSchema = z
	.array(
		z.strictObject({
			name: z.string().min(1).regex(/^\S+$/),
			codepoint: UnicodeScalarSchema,
			categories: z.array(IdSchema).min(1).optional(),
		}),
	)
	.min(1);

export const RegistrySourceCapabilitiesSchema = z.strictObject({
	glyphCount: z.number().int().positive(),
	codepointCount: z.number().int().positive(),
	unicodeRange: z
		.string()
		.regex(
			/^U\+[0-9A-F]{4,6}(?:-[0-9A-F]{4,6})?(?:, U\+[0-9A-F]{4,6}(?:-[0-9A-F]{4,6})?)*$/,
		),
	features: z.strictObject({
		gsub: z.array(z.string().length(4)),
		gpos: z.array(z.string().length(4)),
	}),
	outline: z.enum(['glyf', 'cff', 'cff2', 'bitmap']),
	colorTables: z.array(z.string().length(4)),
});

export const RegistrySubsetsSchema = z.array(IdSchema);

const RegistryLanguageSchema = z.strictObject({
	id: LanguageIdSchema,
	language: z.string().min(1).describe('BCP 47 language subtag'),
	script: ScriptSchema.describe('ISO 15924 script code'),
	name: z.string().min(1),
	preferredName: z.string().min(1).optional(),
	autonym: z.string().min(1).optional(),
	sampleText: SampleTextSchema.optional(),
});

export const RegistryLanguagesSchema = z.array(RegistryLanguageSchema);

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

export const RegistryAxesSchema = z.record(
	z.string().length(4),
	AxisRegistryEntrySchema,
);

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
