import { StatusError } from 'itty-router';
import { IDResponse, StatusErrorObject } from './types';

// Fetch latest metadata from metadata worker
export const getMetadata = async (id: string, req: Request, env: Env) => {
	// TODO: We've disabled the service binding for now until Miniflare 3 for Vitest is released
	// TODO: This is due to us wanting to use nested workers which is not supported in Miniflare 2
	// TODO: Alternatively, we could use this once our CDN proxy with jsDelivr is live

	/* const apiPathname = `/v1/fonts/${id}`;
	const url = new URL(req.url);
	url.pathname = apiPathname;

	// Update incoming request to use new pathname
	const newRequest = new Request(url.toString(), {
		...req.clone(),
		method: 'GET',
	});
	const metadata = await env.METADATA.fetch(newRequest);
	if (!metadata.ok) {
		const error = await metadata.json<StatusErrorObject>();
		throw new StatusError(
			500,
			`Bad response from metadata worker. ${error.error}`,
		);
	}

	return await metadata.json<IDResponse>(); */

	const metadata = await fetch(`https://api.fontsource.org/v1/fonts/${id}`);
	if (!metadata.ok) {
		// If font does not exist, return undefined. Other errors should be logged
		if (metadata.status === 404) {
			return;
		}

		const error = await metadata.json<StatusErrorObject>();
		throw new StatusError(
			metadata.status,
			`Bad response from metadata worker. ${error.error}`,
		);
	}

	return await metadata.json<IDResponse>();
};
