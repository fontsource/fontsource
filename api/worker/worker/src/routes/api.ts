import { contentJson } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { listAxisRegistry } from '../features/metadata/axis-registry/handler';
import {
	getFont,
	listFonts,
	listFontValues,
} from '../features/metadata/catalog/handler';
import { getFontStats, listStats } from '../features/metadata/stats/handler';
import {
	getVariableFont,
	listVariableFonts,
} from '../features/metadata/variable/handler';
import { getFontVersions } from '../features/metadata/versions/handler';
import { ErrorResponseSchema, IdParamSchema } from '../schemas/common';
import {
	AxisRegistryCatalogSchema,
	AxisRegistryQuerySchema,
	FontDetailSchema,
	FontFilterQuerySchema,
	FontListItemSchema,
	FontlistQuerySchema,
	FontlistResponseSchema,
	StatsMapSchema,
	StatsResponseSchema,
	VariableCatalogSchema,
	VariableFontDetailSchema,
	VersionResponseSchema,
} from '../schemas/metadata';
import { FontsourceRoute } from './base';

type AppContext = Context<AppEnv>;

export class ListFontValuesRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'listFontValues',
		summary: 'List projected font field values',
		description:
			'Returns a map of font IDs to one projected field from the catalog. ' +
			'Only one query parameter may be used at a time; defaults to "type" when none is supplied.',
		request: {
			query: FontlistQuerySchema,
		},
		responses: {
			'200': {
				description: 'Projected font field values keyed by font ID',
				...contentJson(FontlistResponseSchema),
			},
			'400': {
				description: 'Bad request — more than one query parameter was supplied',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		return listFontValues(c);
	}
}

export class ListFontsRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'listFonts',
		summary: 'List fonts with optional filtering',
		description:
			'Returns an array of font summaries from the catalog. ' +
			'Multiple filter query parameters may be combined; repeated params collapse to the last value.',
		request: {
			query: FontFilterQuerySchema,
		},
		responses: {
			'200': {
				description: 'Array of font summary objects',
				...contentJson(z.array(FontListItemSchema)),
			},
		},
	};

	async handle(c: AppContext) {
		return listFonts(c);
	}
}

export class GetFontRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'getFont',
		summary: 'Get font detail',
		description:
			'Returns full metadata for a single font family, including variant download URLs.',
		request: {
			params: IdParamSchema,
		},
		responses: {
			'200': {
				description: 'Font detail with variants and unicode ranges',
				...contentJson(FontDetailSchema),
			},
			'404': {
				description: 'Font not found',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		return getFont(c, data.params.id);
	}
}

export class ListVariableFontsRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'listVariableFonts',
		summary: 'List variable fonts',
		description:
			'Returns a map of font IDs to variable font metadata for all families that support variable axes.',
		responses: {
			'200': {
				description: 'Variable font catalog keyed by font ID',
				...contentJson(VariableCatalogSchema),
			},
		},
	};

	async handle(c: AppContext) {
		return listVariableFonts(c);
	}
}

export class GetVariableFontRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'getVariableFont',
		summary: 'Get variable font detail',
		description: 'Returns the variable-axis metadata for a single font family.',
		request: {
			params: IdParamSchema,
		},
		responses: {
			'200': {
				description: 'Variable font axes metadata',
				...contentJson(VariableFontDetailSchema),
			},
			'404': {
				description: 'Variable metadata not found for this font',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		return getVariableFont(c, data.params.id);
	}
}

export class ListAxisRegistryRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'listAxisRegistry',
		summary: 'List axis registry',
		description:
			'Returns the axis registry. Optionally filter by axis tag(s) or name(s). ' +
			'Supports repeated query params and comma-separated values. ' +
			'Tag and name filters are unioned (not intersected).',
		request: {
			query: AxisRegistryQuerySchema,
		},
		responses: {
			'200': {
				description: 'Axis registry keyed by axis tag',
				...contentJson(AxisRegistryCatalogSchema),
			},
			'404': {
				description: 'No matching axes found',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		return listAxisRegistry(c);
	}
}

export class ListStatsRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'listStats',
		summary: 'List download statistics',
		description:
			'Returns aggregated download statistics for all font families.',
		responses: {
			'200': {
				description: 'Download statistics keyed by font ID',
				...contentJson(StatsMapSchema),
			},
		},
	};

	async handle(c: AppContext) {
		return listStats(c);
	}
}

export class GetFontStatsRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'getFontStats',
		summary: 'Get font download statistics',
		description:
			'Returns download statistics for a single font family, split by static and variable packages.',
		request: {
			params: IdParamSchema,
		},
		responses: {
			'200': {
				description: 'Font download statistics',
				...contentJson(StatsResponseSchema),
			},
			'404': {
				description: 'Font not found',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		return getFontStats(c, data.params.id);
	}
}

export class GetFontVersionsRoute extends FontsourceRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'getFontVersions',
		summary: 'Get font versions',
		description:
			'Returns the published version list for a font family, including both static and variable package versions when available.',
		request: {
			params: IdParamSchema,
		},
		responses: {
			'200': {
				description: 'Version information',
				...contentJson(VersionResponseSchema),
			},
			'404': {
				description: 'Font not found',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		return getFontVersions(c, data.params.id);
	}
}
