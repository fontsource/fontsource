import { RouterContextProvider, createRequestHandler } from 'react-router';

import { cloudflareContext } from '../app/utils/cloudflare-context';
import { getDocsMarkdownResponse } from '../app/utils/docs/markdown.server';

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
);

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const markdownResponse = await getDocsMarkdownResponse(url.pathname);

		if (markdownResponse) return markdownResponse;

		const context = new RouterContextProvider();
		context.set(cloudflareContext, { env, ctx });

		return requestHandler(request, context);
	},
} satisfies ExportedHandler<Env>;
