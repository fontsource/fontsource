import fs from 'fs-extra';
import { APILicense } from 'google-font-metadata';
import * as path from 'pathe';

import { apache } from '../templates/apache';
import { ofl } from '../templates/ofl';
import { ufl } from '../templates/ufl';
import type { BuildOptions } from '../types';

// Download license from Google Fonts Github repo and save to package
const generateLicense = async (
	fontLicense: (typeof APILicense)[string],
	opts: BuildOptions
) => {
	const licensePath = path.join(opts.dir, 'LICENSE');
	const copyright = fontLicense.original;

	let txt;
	switch (fontLicense.license.type.toLowerCase()) {
		case 'apache license, version 2.0': {
			txt = apache(copyright);
			break;
		}
		case 'sil open font license, 1.1': {
			txt = ofl(copyright);
			break;
		}
		case 'ubuntu font license, 1.0': {
			txt = ufl();
			break;
		}
		default: {
			throw new Error(`Unknown license type: ${fontLicense.license.type}`);
		}
	}

	// Download file and write to package
	await fs.writeFile(licensePath, txt);
};

export { generateLicense };
