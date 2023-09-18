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

interface Version {
	version: string;
}

interface JSDelivrAPIVersion {
	versions?: Version[];
}

export const getAvailableVersions = async (id: string): Promise<string[]> => {
	const resp = await fetch(
		`https://data.jsdelivr.com/v1/packages/npm/@fontsource/${id}`,
	);

	if (!resp.ok) {
		if (resp.status === 404) {
			throw new StatusError(404, `Not Found. ${id} does not exist.`);
		}
		console.log(await resp.text());
		throw new StatusError(
			500,
			'Internal Server Error. Unable to fetch versions.',
		);
	}

	const list = (await resp.json()) as JSDelivrAPIVersion;
	if (!list?.versions || list.versions.length === 0) {
		throw new StatusError(404, `Not Found. No versions found for ${id}.`);
	}

	const versions = list.versions.map((version) => version.version);

	return versions;
};

export const getVersion = async (id: string, tag: string): Promise<string> => {
	const versions = await getAvailableVersions(id);

	if (tag === 'latest') {
		// Get latest version in list
		const latest = versions
			.sort((a, b) => {
				const aMajor = a.split('.')[0];
				const bMajor = b.split('.')[0];
				const aMinor = a.split('.')[1];
				const bMinor = b.split('.')[1];
				const aPatch = a.split('.')[2];
				const bPatch = b.split('.')[2];
				if (aMajor > bMajor) return -1;
				if (aMajor < bMajor) return 1;
				if (aMinor > bMinor) return -1;
				if (aMinor < bMinor) return 1;
				if (aPatch > bPatch) return -1;
				if (aPatch < bPatch) return 1;
				return 0;
			})
			.shift();

		if (latest) return latest;
		throw new StatusError(
			404,
			`Not found. Version ${tag} not found for ${id}.`,
		);
	}

	const semver = tag.split('.');

	// If the tag is a full semver, return it
	if (semver.length === 3) {
		const version = versions.find((version) => version === tag);
		if (version) return version;
		throw new StatusError(
			404,
			`Not found. Version ${tag} not found for ${id}.`,
		);
	}

	// Find latest version that matches the minor version
	if (semver.length === 2) {
		const [major, minor] = semver;

		const version = versions
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

		const version = versions
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
	const [id, versionTag] = tag.split('@');
	if (!id) {
		throw new StatusError(
			400,
			'Bad Request. Unable to parse font ID from tag.',
		);
	}
	if (!versionTag) {
		throw new StatusError(
			400,
			'Bad Request. Unable to parse version from tag.',
		);
	}

	// Validate version tag
	const version = await getVersion(id, versionTag);

	return { id, version };
};
