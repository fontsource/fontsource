import { StatusError } from 'itty-router';

import { type IDResponse } from './types';

export const getMetadata = async (id: string) => {
	const resp = await fetch(`https://api.fontsource.org/v1/fonts/${id}`);

	if (!resp.ok) {
		throw new StatusError(resp.status, `Unable to fetch metadata for ${id}.`);
	}

	return await resp.json<IDResponse>();
};

export const verifyAuth = (req: Request) => {
	const authHeader = req.headers.get('Authorization');
	if (!authHeader) {
		throw new StatusError(401, 'Unauthorized. Missing authorization header.');
	}
	const [scheme, encoded] = authHeader.split(' ');

	// The Authorization header must start with Bearer, followed by a space.
	if (!encoded || scheme !== 'Bearer') {
		throw new StatusError(400, 'Bad Request. Malformed authorization header.');
	}

	if (encoded !== process.env.UPLOAD_KEY) {
		throw new StatusError(401, 'Unauthorized. Invalid authorization token.');
	}
};

interface Tag {
	id: string;
	version: string;
}

export const splitTag = (tag: string): Tag => {
	// Parse tag for version e.g roboto@1.1.1
	const [id, version] = tag.split('@');
	if (!id) {
		throw new StatusError(
			400,
			'Bad Request. Unable to parse font ID from tag.',
		);
	}
	if (!version) {
		throw new StatusError(
			400,
			'Bad Request. Unable to parse version from tag.',
		);
	}
	if (version.split('.').length !== 3) {
		throw new StatusError(400, 'Bad Request. Invalid semver version.');
	}

	return { id, version };
};
