import { contentJson, OpenAPIRoute } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';
import {
	RegistryAxesSchema,
	RegistryFamiliesSchema,
	RegistryFamilyDetailSchema,
	RegistryIdParamSchema,
	RegistryInfoSchema,
	RegistrySourceParamSchema,
	RegistrySubsetSchema,
	RegistrySubsetsSchema,
	RegistryTaxonomySchema,
} from '../../../shared/registry';
import type { AppEnv } from '../env';
import {
	getRegistrySource,
	getRegistryView,
} from '../features/registry/handler';
import { ErrorResponseSchema } from '../schemas/common';

type AppContext = Context<AppEnv>;

const registryResponses = (schema: z.ZodType) => ({
	'200': {
		description: 'Registry data from the current snapshot',
		...contentJson(schema),
	},
	'304': {
		description: 'Not modified (conditional request)',
	},
	'502': {
		description: 'The current registry snapshot is unavailable or incomplete',
		...contentJson(ErrorResponseSchema),
	},
});

export class GetRegistryRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'getRegistry',
		summary: 'Get the current registry snapshot',
		responses: registryResponses(RegistryInfoSchema),
	};

	async handle(c: AppContext) {
		return getRegistryView(c, 'registry.json');
	}
}

export class ListRegistryFamiliesRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'listRegistryFamilies',
		summary: 'List registry font families',
		responses: registryResponses(RegistryFamiliesSchema),
	};

	async handle(c: AppContext) {
		return getRegistryView(c, 'families.json');
	}
}

export class GetRegistryTaxonomyRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'getRegistryTaxonomy',
		summary: 'Get registry classifications and tags',
		responses: registryResponses(RegistryTaxonomySchema),
	};

	async handle(c: AppContext) {
		return getRegistryView(c, 'taxonomy.json');
	}
}

export class GetRegistryFamilyRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'getRegistryFamily',
		summary: 'Get a registry font family',
		request: {
			params: RegistryIdParamSchema,
		},
		responses: {
			...registryResponses(RegistryFamilyDetailSchema),
			'404': {
				description: 'Registry family not found',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		return getRegistryView(
			c,
			`families/${data.params.id}.json`,
			'Not Found. Registry family does not exist.',
		);
	}
}

export class ListRegistrySubsetsRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'listRegistrySubsets',
		summary: 'List registry Unicode subsets',
		responses: registryResponses(RegistrySubsetsSchema),
	};

	async handle(c: AppContext) {
		return getRegistryView(c, 'subsets.json');
	}
}

export class GetRegistrySubsetRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'getRegistrySubset',
		summary: 'Get a registry Unicode subset',
		request: {
			params: RegistryIdParamSchema,
		},
		responses: {
			...registryResponses(RegistrySubsetSchema),
			'404': {
				description: 'Registry subset not found',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		return getRegistryView(
			c,
			`subsets/${data.params.id}.json`,
			'Not Found. Registry subset does not exist.',
		);
	}
}

export class ListRegistryAxesRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'listRegistryAxes',
		summary: 'List registry variable axes',
		responses: registryResponses(RegistryAxesSchema),
	};

	async handle(c: AppContext) {
		return getRegistryView(c, 'axes.json');
	}
}

export class GetRegistrySourceRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'getRegistrySource',
		summary: 'Get an archived source font',
		request: {
			params: RegistrySourceParamSchema,
		},
		responses: {
			'200': {
				description: 'Original TTF or OTF source font',
				content: {
					'font/ttf': { schema: z.string() },
					'font/otf': { schema: z.string() },
				},
			},
			'304': {
				description: 'Not modified (conditional request)',
			},
			'404': {
				description: 'Registry source not found',
				...contentJson(ErrorResponseSchema),
			},
			'502': {
				description: 'The archived source metadata is invalid',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		return getRegistrySource(c, data.params.sha256);
	}
}
