import { StatusError } from 'itty-router';

import { type JSDelivrAPIVersion } from './types';

export const getAvailableVersions = async (id: string): Promise<string[]> => {
	const npmList = await fetch(
		`https://data.jsdelivr.com/v1/packages/npm/@fontsource/${id}`,
	).then(async (res) => await res.json<JSDelivrAPIVersion>());

	const versions = npmList.versions.map((version) => version.version);

	return versions;
};

/**
 * Take in a URL and return the version tag specified in the URL.
 * @example "http://r2.fontsource.org/fonts/abel@latest/latin-400-normal.ttf" to latest
 */
export const getVersion = async (id: string, url: string): Promise<string> => {
	const tagUrl = url.split('@')[1];
	if (!tagUrl) throw new StatusError(404, `Missing tag for ${id}.`);
	const tag = tagUrl.split('/')[0];
	if (!tag) throw new StatusError(404, `Missing file for ${id}.`);

	if (tag === 'latest') return tag;

	const semver = tag.split('.');

	const versions = await getAvailableVersions(id);

	// If the tag is a full semver, return it
	if (semver.length === 3) {
		const version = versions.find((version) => version === tag);
		if (version) return version;
		throw new StatusError(404, `Version ${tag} not found for ${id}.`);
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
		throw new StatusError(404, `Version ${tag} not found for ${id}.`);
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
		throw new StatusError(404, `Version ${tag} not found for ${id}.`);
	}

	throw new StatusError(404, `Invalid tag ${tag} for ${id}.`);
};
