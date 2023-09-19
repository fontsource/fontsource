import { StatusError } from 'itty-router';
import { IDResponse, StatusErrorObject } from './types';

// Fetch latest metadata from metadata worker
export const getMetadata = async (id: string) => {
	// TODO: We've disabled the service binding for now until Miniflare 3 for Vitest is released
	// TODO: This is due to us wanting to use nested workers which is not supported in Miniflare 2
	// TODO: Alternatively, we could use this once our CDN proxy with jsDelivr is live

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

// Fetch latest metadata from metadata worker
export const getMetadataCF = async (id: string, req: Request, env: Env) => {
	const apiPathname = `/v1/fonts/${id}`;
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
			metadata.status,
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
	if (!id) {
		throw new Response('Bad Request. Unable to parse font ID from tag.', {
			status: 400,
		});
	}
	if (!versionTag) {
		throw new Response('Bad Request. Unable to parse version from tag.', {
			status: 400,
		});
	}

	// Validate version tag
	const version = await getVersion(id, versionTag);

	return { id, version };
};

export const splitTagCF = async (tag: string): Promise<Tag> => {
	// Parse tag for version e.g roboto@1.1.1
	let [id, versionTag] = tag.split('@');
	if (!id) {
		throw new StatusError(
			400,
			'Bad Request. Unable to parse font ID from tag.',
		);
	}
	if (!versionTag) {
		versionTag = 'latest';
	}

	// Validate version tag
	const version = await getVersion(id, versionTag);

	return { id, version };
};
