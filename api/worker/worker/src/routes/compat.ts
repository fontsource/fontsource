import { contentJson, OpenAPIRoute } from 'chanfana';
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

type AppContext = Context<AppEnv>;

export class DownloadFontRoute extends OpenAPIRoute {
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
				description: 'Build failed to produce the archive',
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

export class LegacyFontFileRedirectRoute extends OpenAPIRoute {
	schema = {
		tags: ['Compatibility'],
		operationId: 'legacyFontFileRedirect',
		summary: 'Legacy font file redirect',
		description:
			'Backward-compatible redirect from the old `/v1/fonts/:id/:file` layout ' +
			'to the public jsDelivr CDN.',
		request: {
			params: FileRedirectParamSchema,
		},
		responses: {
			'301': {
				description: 'Permanent redirect to the public jsDelivr font asset URL',
			},
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { id, file } = data.params;

		c.header('Cache-Control', CACHE_HEADERS.redirect);
		return c.redirect(
			`${UPSTREAM_URLS.publicCdn}/fonts/${id}@latest/${file}`,
			301,
		);
	}
}
