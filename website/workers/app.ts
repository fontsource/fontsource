import { createRequestHandler, RouterContextProvider } from 'react-router';

import { cacheHeaders } from '../app/utils/cache';
import { cloudflareContext } from '../app/utils/cloudflare-context';
import { getDocsMarkdownResponse } from '../app/utils/docs/markdown.server';
import { captureServerError } from '../app/utils/posthog.server';

const requestHandler = createRequestHandler(
	() => import('virtual:react-router/server-build'),
	import.meta.env.MODE,
);

const preventErrorCaching = (response: Response) => {
	if (response.status < 400) return response;

	const headers = new Headers(response.headers);
	for (const [name, value] of Object.entries(cacheHeaders.noStore)) {
		headers.set(name, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
};

export default {
	async fetch(request, env, ctx) {
		try {
			const url = new URL(request.url);
			const markdownResponse = await getDocsMarkdownResponse(url.pathname);

			if (markdownResponse) return preventErrorCaching(markdownResponse);

			const context = new RouterContextProvider();
			context.set(cloudflareContext, { env, ctx });

			return preventErrorCaching(await requestHandler(request, context));
		} catch (error) {
			ctx.waitUntil(captureServerError(error, request));
			throw error;
		}
	},
} satisfies ExportedHandler<Env>;
