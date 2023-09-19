import { StatusError } from 'itty-router';
import { IDResponse, StatusErrorObject, VersionResponse } from './types';

interface Tag {
	id: string;
	version: string;
}

// Fetch latest metadata from metadata worker
export const getMetadata = async (id: string, req: Request, env: Env) => {
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

export const findVersion = async (
	id: string,
	tag: string,
	versions: VersionResponse,
): Promise<string> => {
	if (tag === 'latest') {
		// Get latest version in list
		const latest = versions.static.shift();

		if (latest) return latest;
		throw new StatusError(
			404,
			`Not found. Version ${tag} not found for ${id}.`,
		);
	}

	const semver = tag.split('.');

	// If the tag is a full semver, return it
	if (semver.length === 3) {
		const version = versions.static.find((version) => version === tag);
		if (version) return version;
		throw new StatusError(
			404,
			`Not found. Version ${tag} not found for ${id}.`,
		);
	}

	// Find latest version that matches the minor version
	if (semver.length === 2) {
		const [major, minor] = semver;

		const version = versions.static
			// Filter out the major and minor versions that don't match
			.filter((version) => version.startsWith(`${major}.${minor}`))
			// Sort the versions in descending order
			.sort((a, b) => {
				const aPatch = a.split('.')[2];
				const bPatch = b.split('.')[2];
				if (aPatch > bPatch) return -1;
				if (aPatch < bPatch) return 1;
				return 0;
			})
			// Return the first version
			.shift();

		if (version) return version;
		throw new StatusError(
			404,
			`Not found. Version ${tag} not found for ${id}.`,
		);
	}

	// Find latest version that matches the major version
	if (semver.length === 1) {
		const [major] = semver;

		const version = versions.static
			.filter((version) => version.startsWith(`${major}.`))
			// Sort the versions in descending order
			.sort((a, b) => {
				const aMinor = a.split('.')[1];
				const bMinor = b.split('.')[1];
				const aPatch = a.split('.')[2];
				const bPatch = b.split('.')[2];
				if (aMinor > bMinor) return -1;
				if (aMinor < bMinor) return 1;
				if (aPatch > bPatch) return -1;
				if (aPatch < bPatch) return 1;
				return 0;
			})
			// Return the first version
			.shift();

		if (version) return version;
		throw new StatusError(
			404,
			`Not found. Version ${tag} not found for ${id}.`,
		);
	}

	throw new StatusError(400, `Bad Request. Invalid tag ${tag} for ${id}.`);
};

export const getVersion = async (
	id: string,
	version: string,
	req: Request,
	env: Env,
) => {
	const apiPathname = `/v1/version/${id}`;
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

	return await metadata.json<VersionResponse>();
};

export const splitTag = async (
	tag: string,
	req: Request,
	env: Env,
): Promise<Tag> => {
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
	const versionMeta = await getVersion(id, versionTag, req, env);

	if (versionTag === 'latest') {
		return { id, version: versionMeta.latest };
	}

	return { id, version: await findVersion(id, versionTag, versionMeta) };
};
