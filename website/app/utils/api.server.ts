import { env } from 'cloudflare:workers';
import { data } from 'react-router';

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
export const fetchApiData = async <T>(url: string): Promise<T> => {
	const response = await env.API.fetch(url);

	if (!response.ok) {
		await throwApiResponseError(response, url);
	}

	return response.json() as T;
};
