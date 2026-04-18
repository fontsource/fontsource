import { z } from 'zod';

// Catalog types

export const AxisValueSchema = z.object({
	default: z.string(),
	min: z.string(),
	max: z.string(),
	step: z.string(),
});

export const VariableAxesSchema = z.record(z.string(), AxisValueSchema);

export const FontListItemSchema = z.object({
	id: z.string(),
	family: z.string(),
	subsets: z.array(z.string()),
	weights: z.array(z.number().int()),
	styles: z.array(z.string()),
	defSubset: z.string(),
	variable: z.boolean(),
	lastModified: z.string(),
	category: z.string(),
	license: z.string(),
	type: z.string(),
});

export const FontVariantUrlsSchema = z.object({
	woff2: z.string(),
	woff: z.string(),
	ttf: z.string(),
});

export const FontVariantsSchema = z.record(
	z.string(),
	z.record(
		z.string(),
		z.record(z.string(), z.object({ url: FontVariantUrlsSchema })),
	),
);

export const FontDetailSchema = FontListItemSchema.extend({
	unicodeRange: z.record(z.string(), z.string()),
	variants: FontVariantsSchema,
});

export const VariableFontDetailSchema = z.object({
	family: z.string(),
	axes: VariableAxesSchema,
});

export const VariableCatalogSchema = z.record(
	z.string(),
	VariableFontDetailSchema,
);

// Stats types

export const DownloadStatsSchema = z.object({
	npmDownloadTotal: z.number().int(),
	npmDownloadMonthly: z.number().int(),
	jsDelivrHitsTotal: z.number().int(),
	jsDelivrHitsMonthly: z.number().int(),
});

export const StatsResponseSchema = z.object({
	total: DownloadStatsSchema,
	static: DownloadStatsSchema,
	variable: DownloadStatsSchema.optional(),
});

export const StatsMapSchema = z.record(z.string(), StatsResponseSchema);

// Axis-registry types

export const AxisRegistryEntrySchema = z.object({
	name: z.string(),
	description: z.string(),
	min: z.number(),
	max: z.number(),
	default: z.number(),
	precision: z.number(),
});

export const AxisRegistryCatalogSchema = z.record(
	z.string(),
	AxisRegistryEntrySchema,
);

// Versions

export const VersionResponseSchema = z.object({
	latest: z.string(),
	static: z.array(z.string()),
	latestVariable: z.string().optional(),
	variable: z.array(z.string()).optional(),
});

// /fontlist response

export const FontlistResponseSchema = z.record(
	z.string(),
	z.union([z.string(), z.array(z.string()), z.array(z.number()), z.boolean()]),
);

// ---------------------------------------------------------------------------
// Query parameter schemas (for OpenAPI documentation only — the handlers
// perform their own validation so these are all optional)
// ---------------------------------------------------------------------------

export const FontlistQuerySchema = z
	.object({
		family: z.string().optional().describe('Project by family name'),
		subsets: z.string().optional().describe('Project by subset'),
		weights: z.string().optional().describe('Project by weight'),
		styles: z.string().optional().describe('Project by style'),
		variable: z.string().optional().describe('Project by variable flag'),
		lastModified: z
			.string()
			.optional()
			.describe('Project by last modified date'),
		category: z.string().optional().describe('Project by category'),
		version: z.string().optional().describe('Project by version'),
		type: z.string().optional().describe('Project by type (default)'),
	})
	.describe(
		'Only one query parameter may be used at a time. Defaults to "type" when none is supplied.',
	);

export const FontFilterQuerySchema = z.object({
	id: z.string().optional().describe('Filter by font id'),
	family: z.string().optional().describe('Filter by family name'),
	subsets: z
		.string()
		.optional()
		.describe('Comma-separated subset values to filter by'),
	weights: z
		.string()
		.optional()
		.describe('Comma-separated weight values to filter by'),
	styles: z
		.string()
		.optional()
		.describe('Comma-separated style values to filter by'),
	defSubset: z.string().optional().describe('Filter by default subset'),
	variable: z
		.string()
		.optional()
		.describe('Filter by variable status ("true" or "false")'),
	lastModified: z.string().optional().describe('Filter by last modified date'),
	category: z.string().optional().describe('Filter by category'),
	license: z.string().optional().describe('Filter by license type'),
	type: z.string().optional().describe('Filter by font type'),
});

export const AxisRegistryQuerySchema = z.object({
	tag: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.describe(
			'Filter by axis tag(s). Supports repeated params and comma-separated values.',
		),
	name: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.describe(
			'Filter by axis name(s). Supports repeated params and comma-separated values.',
		),
});
