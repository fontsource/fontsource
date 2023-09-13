import { StatusError } from 'itty-router';
import { getVersion } from './version';
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
		const error = await metadata.json<StatusErrorObject>();
		throw new StatusError(
			500,
			`Bad response from metadata worker. ${error.error}`,
		);
	}

	return await metadata.json<IDResponse>();
};

interface Tag {
	id: string;
	version: string;
}

export const splitTag = async (tag: string): Promise<Tag> => {
	// Parse tag for version e.g roboto@1.1.1
	const [id, versionTag] = tag.split('@');
	if (!versionTag) {
		throw new StatusError(
			400,
			'Bad Request. Invalid tag format.' + tag + id + versionTag,
		);
	}

	// Validate version tag
	const version = await getVersion(id, versionTag);

	return { id, version };
};
