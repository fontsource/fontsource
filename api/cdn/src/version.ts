import { type JSDelivrAPIVersion } from './types';

const getAvailableVersions = async (id: string): Promise<string[]> => {
	const npmList = await fetch(
		`https://data.jsdelivr.com/v1/packages/npm/@fontsource/${id}`
	).then(async (res) => await res.json<JSDelivrAPIVersion>());

	const versions = npmList.versions.map((version) => version.version);

	return versions;
};

/**
 * Take in a URL and return the version tag
 * http://r2.fontsource.org/fonts/abel@latest/latin-400-normal.ttf to latest
 */
export const getVersion = async (id: string, url: string): Promise<string> => {
	const tag = url.split('@')[1].split('/')[0];

	if (tag === 'latest') return tag;

	const semver = tag.split('.');

	// If the tag is a full semver, return it
	if (semver.length === 3) return tag;

	const versions = await getAvailableVersions(id);

	// Find latest version that matches the minor version
	if (semver.length === 2) {
		const [major, minor] = semver;

		const version = versions
			.filter((version) => version.startsWith(`${major}.`))
			.find((version) => version.startsWith(`${major}.${minor}`));

		if (version) return version;
	}

	// Find latest version that matches the major version
	if (semver.length === 1) {
		const [major] = semver;

		const version = versions.find((version) => version.startsWith(`${major}.`));

		if (version) return version;
	}

	return 'latest';
};
