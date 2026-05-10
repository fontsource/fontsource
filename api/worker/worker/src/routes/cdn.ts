import { contentJson, OpenAPIRoute } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';
import { CACHE_HEADERS } from '../constants';
import type { AppEnv } from '../env';
import { getBinaryAsset, getCssFile } from '../features/cdn/handler';
import { parseFontTag } from '../features/font-tag';
import { ErrorResponseSchema, TagFileParamSchema } from '../schemas/common';

type AppContext = Context<AppEnv>;

export class GetBinaryAssetRoute extends OpenAPIRoute {
	schema = {
		tags: ['CDN'],
		operationId: 'getBinaryAsset',
		summary: 'Get binary font asset',
		description:
			'Serves binary font files (woff2, woff, ttf) and download zips from the CDN. ' +
			'Supports pinned and floating version tags. ' +
			'Requests for download.zip on floating or variable tags may redirect to the canonical download endpoint.',
		request: {
			params: TagFileParamSchema,
		},
		responses: {
			'200': {
				description: 'Binary font asset',
				content: {
					'font/woff2': {
						schema: z.string(),
					},
					'font/woff': {
						schema: z.string(),
					},
					'font/ttf': {
						schema: z.string(),
					},
					'application/zip': {
						schema: z.string(),
					},
				},
			},
			'302': {
				description:
					'Redirect to canonical download endpoint for floating/variable download.zip requests',
			},
			'304': {
				description: 'Not modified (conditional request)',
			},
			'400': {
				description: 'Invalid file extension or font tag',
				...contentJson(ErrorResponseSchema),
			},
			'404': {
				description: 'Font or file not found',
				...contentJson(ErrorResponseSchema),
			},
			'502': {
				description: 'Artifact build did not persist the requested file',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { tag, file } = data.params;

		// Route floating zip aliases through the canonical download endpoint so
		// they share one cached archive.
		if (file === 'download.zip') {
			const parsedTag = parseFontTag(tag);
			const deploymentOrigin = new URL(c.req.url).origin;

			if (parsedTag.isVariable) {
				c.header('Cache-Control', CACHE_HEADERS.redirect);
				return c.redirect(
					parsedTag.version === 'latest'
						? `${deploymentOrigin}/v1/download/${parsedTag.id}`
						: `${deploymentOrigin}/fonts/${parsedTag.id}@${parsedTag.version}/download.zip`,
					302,
				);
			}

			if (parsedTag.version === 'latest') {
				c.header('Cache-Control', CACHE_HEADERS.redirect);
				return c.redirect(
					`${deploymentOrigin}/v1/download/${parsedTag.id}`,
					302,
				);
			}
		}

		return getBinaryAsset(c, tag, file);
	}
}

export class GetCssFileRoute extends OpenAPIRoute {
	schema = {
		tags: ['CDN'],
		operationId: 'getCssFile',
		summary: 'Get generated CSS stylesheet',
		description:
			'Serves dynamically generated CSS stylesheets for font face declarations. ' +
			'Supports both static and variable font tags.',
		request: {
			params: TagFileParamSchema,
		},
		responses: {
			'200': {
				description: 'CSS stylesheet with @font-face declarations',
				content: {
					'text/css; charset=utf-8': {
						schema: z.string(),
					},
				},
			},
			'400': {
				description: 'Invalid file extension',
				...contentJson(ErrorResponseSchema),
			},
			'404': {
				description: 'Font or CSS file not found',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { tag, file } = data.params;
		return getCssFile(c, tag, file);
	}
}
