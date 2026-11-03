import { contentJson, OpenAPIRoute } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';
import {
	PreparedArtifactIdSchema,
	PreparedArtifactParamsSchema,
	PreparedArtifactPathSchema,
	PreparedArtifactSchema,
} from '../../../shared/prepared-artifacts';
import type { AppEnv } from '../env';
import {
	getPreparedArtifact,
	getPreparedArtifactFile,
} from '../features/registry/artifacts';
import { ErrorResponseSchema } from '../schemas/common';

const errors = {
	'304': { description: 'Not modified' },
	'400': {
		description: 'Invalid artifact selection',
		...contentJson(ErrorResponseSchema),
	},
	'404': {
		description: 'Completed artifact not found',
		...contentJson(ErrorResponseSchema),
	},
	'502': {
		description: 'Artifact is incomplete or invalid',
		...contentJson(ErrorResponseSchema),
	},
};

export class GetPreparedArtifactRoute extends OpenAPIRoute {
	schema = {
		tags: ['Registry'],
		operationId: 'getPreparedArtifact',
		summary:
			'Get completed standard web assets before or after npm publication',
		request: {
			params: PreparedArtifactParamsSchema,
			query: z.object({ artifact: PreparedArtifactIdSchema.optional() }),
		},
		responses: {
			'200': {
				description: 'Frozen metadata and downloadable web assets',
				...contentJson(PreparedArtifactSchema),
			},
			...errors,
		},
	};
	async handle(c: Context<AppEnv>) {
		const { params, query } = await this.getValidatedData<typeof this.schema>();
		return getPreparedArtifact(c, params.id, params.kind, query.artifact);
	}
}

export class GetPreparedArtifactFileRoute extends OpenAPIRoute {
	schema = {
		tags: ['CDN'],
		operationId: 'getPreparedArtifactFile',
		summary: 'Get a completed web font or stylesheet',
		request: {
			params: PreparedArtifactParamsSchema.extend({
				artifact: PreparedArtifactIdSchema,
				file: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.css$/),
			}),
		},
		responses: {
			'200': {
				description: 'Web font or stylesheet',
				content: {
					'font/woff2': { schema: z.string() },
					'text/css': { schema: z.string() },
				},
			},
			...errors,
		},
	};
	async handle(c: Context<AppEnv>) {
		const { params } = await this.getValidatedData<typeof this.schema>();
		const path = PreparedArtifactPathSchema.parse(
			params.file.endsWith('.woff2') ? `files/${params.file}` : params.file,
		);
		return getPreparedArtifactFile(
			c,
			params.id,
			params.kind,
			params.artifact,
			path,
		);
	}
}

export class GetPreparedArtifactFontRoute extends GetPreparedArtifactFileRoute {
	constructor(
		...args: ConstructorParameters<typeof GetPreparedArtifactFileRoute>
	) {
		super(...args);
		this.schema = {
			...this.schema,
			operationId: 'getPreparedArtifactFont',
			request: {
				params: this.schema.request.params.extend({
					file: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.woff2$/),
				}),
			},
		};
	}
}
