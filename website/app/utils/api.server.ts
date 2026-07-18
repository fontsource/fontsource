import { env } from 'cloudflare:workers';
import { data } from 'react-router';

import type { CreateClientConfig } from '@/generated/api/client.gen';
import { cacheHeaders } from '@/utils/cache';

export const throwApiResponseError = async (
	response: Response,
	url: string,
): Promise<never> => {
	const body = await response.text();
	let message =
		body || response.statusText || `Failed to fetch data from ${url}`;

	if (body) {
		try {
			const payload = JSON.parse(body) as { error?: string };
			message = payload.error ?? body;
		} catch {
			// Preserve a non-JSON upstream error body as-is.
		}
	}

	throw data(
		{ error: message },
		{
			status: response.status,
			statusText: response.statusText,
			headers: cacheHeaders.noStore,
		},
	);
};

export const createClientConfig: CreateClientConfig = (config) => ({
	...config,
	baseUrl: 'https://api.fontsource.org',
	fetch: async (input, init) => {
		const request = new Request(input, init);
		const response = await env.API.fetch(request);

		if (!response.ok) {
			await throwApiResponseError(response, request.url);
		}

		return response;
	},
});
