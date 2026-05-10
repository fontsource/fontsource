import { createRequestHandler } from 'react-router';

import { getDocsMarkdownResponse } from '../app/utils/docs/markdown.server';

declare module 'react-router' {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const markdownResponse = await getDocsMarkdownResponse(url.pathname);

		if (markdownResponse) return markdownResponse;

		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<Env>;
