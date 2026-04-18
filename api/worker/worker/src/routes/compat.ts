import { contentJson } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';
import { CACHE_HEADERS, UPSTREAM_URLS } from '../constants';
import type { AppEnv } from '../env';
import { getBinaryAsset } from '../features/cdn/handler';
import {
	ErrorResponseSchema,
	FileRedirectParamSchema,
	IdParamSchema,
} from '../schemas/common';
import { FontsourceRoute } from './base';

type AppContext = Context<AppEnv>;

export class DownloadFontRoute extends FontsourceRoute {
	schema = {
		tags: ['Downloads'],
		operationId: 'downloadFont',
		summary: 'Download latest font package',
		description: 'Serves the latest pre-built zip archive for a font family.',
		request: {
			params: IdParamSchema,
		},
		responses: {
			'200': {
				description: 'Zip archive of the latest font package',
				content: {
					'application/zip': {
						schema: z.string(),
					},
				},
			},
			'304': {
				description: 'Not modified (conditional request)',
			},
			'404': {
				description: 'Font not found',
				...contentJson(ErrorResponseSchema),
			},
			'502': {
				description: 'Bad gateway \u2014 build failed to produce the archive',
				...contentJson(ErrorResponseSchema),
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id } = data.params;
		return getBinaryAsset(c, `${id}@latest`, 'download.zip');
	}
}

export class LegacyFontFileRedirectRoute extends FontsourceRoute {
	schema = {
		tags: ['Compatibility'],
		operationId: 'legacyFontFileRedirect',
		summary: 'Legacy font file redirect',
		description:
			'Backward-compatible redirect from the old `/v1/fonts/:id/:file` layout. ' +
			'Requests for `download.zip` redirect (302) to the canonical download endpoint. ' +
			'All other files redirect (301) to the CDN.',
		request: {
			params: FileRedirectParamSchema,
		},
		responses: {
			'301': {
				description: 'Permanent redirect to the CDN for font asset files',
			},
			'302': {
				description:
					'Temporary redirect to the download endpoint for download.zip',
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id, file } = data.params;

		if (file === 'download.zip') {
			c.header('Cache-Control', CACHE_HEADERS.redirect);
			return c.redirect(`${UPSTREAM_URLS.publicApi}/v1/download/${id}`, 302);
		}

		c.header('Cache-Control', CACHE_HEADERS.redirect);
		return c.redirect(
			`${UPSTREAM_URLS.publicCdn}/fonts/${id}@latest/${file}`,
			301,
		);
	}
}
