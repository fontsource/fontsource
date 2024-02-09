import { StatusError } from 'itty-router';

interface Version {
	version: string;
}

interface JSDelivrAPIVersion {
	versions?: Version[];
}

export const sortSemverList = (list: string[]): string[] => {
	return list.sort((a, b) => {
		const aSplit = a.split('.');
		const bSplit = b.split('.');

		const aMajor = Number(aSplit[0]);
		const bMajor = Number(bSplit[0]);
		const aMinor = Number(aSplit[1]);
		const bMinor = Number(bSplit[1]);
		const aPatch = Number(aSplit[2]);
		const bPatch = Number(bSplit[2]);
		if (aMajor > bMajor) return -1;
		if (aMajor < bMajor) return 1;
		if (aMinor > bMinor) return -1;
		if (aMinor < bMinor) return 1;
		if (aPatch > bPatch) return -1;
		if (aPatch < bPatch) return 1;
		return 0;
	});
};

export const getAvailableVersions = async (
	id: string,
	isVariable?: boolean,
): Promise<string[]> => {
	const url = isVariable
		? `https://data.jsdelivr.com/v1/packages/npm/@fontsource-variable/${id}`
		: `https://data.jsdelivr.com/v1/packages/npm/@fontsource/${id}`;

	const resp = await fetch(url);

	if (!resp.ok) {
		if (resp.status === 404) {
			throw new StatusError(404, `Not Found. ${id} does not exist.`);
		}

		// Log error with logpush
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

	return sortSemverList(versions);
};
