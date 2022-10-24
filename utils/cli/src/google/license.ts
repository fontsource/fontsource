import fs from 'fs-extra';
import got from 'got';
import * as path from 'pathe';

import type { BuildOptions } from '../types';

const BASE_URL = 'https://cdn.jsdelivr.net/gh/google/fonts@main/';

const apache = (id: string) => `apache/${id}/LICENSE.txt`;
const ofl = (id: string) => `ofl/${id}/OFL.txt`;
const ufl = (id: string) => `ufl/${id}/UFL.txt`;

// Download license from Google Fonts Github repo and save to package
const generateLicense = async (
	id: string,
	licenseType: string,
	opts: BuildOptions
) => {
	const licensePath = path.join(opts.dir, 'LICENSE');
	const googleId = id.replace(/-/g, '');

	let licenseUrl;
	switch (licenseType.toLowerCase()) {
		case 'apache license, version 2.0': {
			licenseUrl = `${BASE_URL}${apache(googleId)}`;
			break;
		}
		case 'sil open font license, 1.1': {
			licenseUrl = `${BASE_URL}${ofl(googleId)}`;
			break;
		}
		case 'ubuntu font license, 1.0': {
			licenseUrl = `${BASE_URL}${ufl(googleId)}`;
			break;
		}
		default: {
			throw new Error(`Unknown license type: ${licenseType}`);
		}
	}

	// Download file and write to package
	try {
		const { body } = await got.get(licenseUrl);
		await fs.writeFile(licensePath, body);
	} catch (error) {
		throw new Error(`Unable to download license for ${id}\n${error}`);
	}
};

export { generateLicense };
