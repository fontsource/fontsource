import { contentJson, OpenAPIRoute } from 'chanfana';
import type { Context } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '../env';
import { ErrorResponseSchema, IdParamSchema } from '../schemas/common';

type AppContext = Context<AppEnv>;

export class GetFontOpenGraphRoute extends OpenAPIRoute {
	schema = {
		tags: ['Open Graph'],
		operationId: 'getFontOpenGraphImage',
		summary: 'Render a font Open Graph image',
		description:
			'Renders a 1200×630 PNG social card from the current font metadata and a published font face.',
		request: {
			params: IdParamSchema,
		},
		responses: {
			'200': {
				description: 'Rendered Open Graph image',
				content: {
					'image/png': {
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
		},
	};

	async handle(c: AppContext) {
		const data = await this.getValidatedData<typeof this.schema>();
		const { getFontOpenGraphImage } = await import(
			'../features/open-graph/handler'
		);
		return getFontOpenGraphImage(c, data.params.id);
	}
}
