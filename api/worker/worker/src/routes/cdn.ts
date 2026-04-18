import { contentJson } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';
import { CACHE_HEADERS, UPSTREAM_URLS } from '../constants';
import type { AppEnv } from '../env';
import { getBinaryAsset, getCssFile } from '../features/cdn/handler';
import { parseFontTag } from '../features/font-tag';
import { ErrorResponseSchema, TagFileParamSchema } from '../schemas/common';
import { FontsourceRoute } from './base';

type AppContext = Context<AppEnv>;

export class GetBinaryAssetRoute extends FontsourceRoute {
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
				description: 'Bad request \u2014 invalid file extension or font tag',
				...contentJson(ErrorResponseSchema),
			},
			'404': {
				description: 'Font or file not found',
				...contentJson(ErrorResponseSchema),
			},
			'502': {
				description:
					'Bad gateway \u2014 artifact build failed to persist the requested file',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { tag, file } = data.params;

		// download.zip on a variable or "latest" floating tag is served through the
		// canonical download endpoint rather than directly from R2. This avoids storing
		// a separate copy per-tag and ensures the client always receives the latest
		// pre-built archive without stale-cache issues.
		if (file === 'download.zip') {
			const parsedTag = parseFontTag(tag);

			if (parsedTag.isVariable) {
				c.header('Cache-Control', CACHE_HEADERS.redirect);
				return c.redirect(
					parsedTag.version === 'latest'
						? `${UPSTREAM_URLS.publicApi}/v1/download/${parsedTag.id}`
						: `${UPSTREAM_URLS.publicApi}/fonts/${parsedTag.id}@${parsedTag.version}/download.zip`,
					302,
				);
			}

			if (parsedTag.version === 'latest') {
				c.header('Cache-Control', CACHE_HEADERS.redirect);
				return c.redirect(
					`${UPSTREAM_URLS.publicApi}/v1/download/${parsedTag.id}`,
					302,
				);
			}
		}

		return getBinaryAsset(c, tag, file);
	}
}

export class GetCssFileRoute extends FontsourceRoute {
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
				description: 'Bad request \u2014 invalid file extension',
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
