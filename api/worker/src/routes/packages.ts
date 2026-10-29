import { contentJson, OpenAPIRoute } from 'chanfana';
import type { Context } from 'hono';
import {
	PackageKindSchema,
	PackageVersionSchema,
	PublishedPackageOutputSchema,
	PublishedPackagesSchema,
} from '../../../shared/published-packages';
import { RegistryIdParamSchema } from '../../../shared/registry';
import type { AppEnv } from '../env';
import { getPackageOutput } from '../features/metadata/packages/output';
import { getPublishedPackages } from '../features/metadata/store';
import { ErrorResponseSchema } from '../schemas/common';

export class ListPublishedPackagesRoute extends OpenAPIRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'listPublishedPackages',
		summary: 'List verified published packages',
		responses: {
			'200': {
				description: 'Promoted versions keyed by family ID',
				...contentJson(PublishedPackagesSchema),
			},
		},
	};
	async handle(c: Context<AppEnv>) {
		return c.json(await getPublishedPackages(c));
	}
}
export class GetPackageOutputRoute extends OpenAPIRoute {
	schema = {
		tags: ['Metadata'],
		operationId: 'getPackageOutput',
		summary: 'Read exact published V6 package output',
		request: {
			params: RegistryIdParamSchema.extend({
				kind: PackageKindSchema,
				version: PackageVersionSchema,
			}),
		},
		responses: {
			'200': {
				description: 'Built faces, entrypoints and frozen build metadata',
				...contentJson(PublishedPackageOutputSchema),
			},
			'404': {
				description: 'Package version unavailable',
				...contentJson(ErrorResponseSchema),
			},
			'502': {
				description: 'Published package output unavailable or invalid',
				...contentJson(ErrorResponseSchema),
			},
		},
	};
	async handle(c: Context<AppEnv>) {
		const {
			params: { id, kind, version },
		} = await this.getValidatedData<typeof this.schema>();
		return getPackageOutput(c, id, kind, version);
	}
}
