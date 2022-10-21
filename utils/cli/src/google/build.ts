import fs from 'fs-extra';
import { APIv2, APIVariable } from 'google-font-metadata';
import * as path from 'pathe';

import { BuildOptions } from '../types';
import { download } from './download';
import { packagerV1 } from './packager-v1';

const build = async (id: string, opts: BuildOptions) => {
	const font = APIv2[id];

	// Set file directories
	const fontDir = path.join(opts.dir, id);
	await fs.mkdir(fontDir, { recursive: true });

	// Check if updated
	let changed = false;

	try {
		await fs.access(`${fontDir}/metadata.json`);
		const metadata = JSON.parse(
			await fs.readFile(`${fontDir}/metadata.json`, 'utf8')
		);
		changed = metadata.lastModified !== font.lastModified;
	} catch {
		changed = true;
	}

	// If needs updating, preserve package.json in temporary folder till later
	if (changed || opts.force) {
		try {
			// Copy to temp folder
			await fs.access(`${fontDir}/package.json`);
			await fs.copy(`${fontDir}/package.json`, `${opts.tmpDir}/${id}.json`);
			await fs.emptyDir(fontDir);
			// Copy back to original folder
			await fs.copy(`${opts.tmpDir}/${id}.json`, `${fontDir}/package.json`);
			await fs.remove(`${opts.tmpDir}/${id}.json`);
		} catch {
			// Continue regardless of error
		}
	}

	// Check if variable font
	const isVariable = Boolean(APIVariable[id]);

	// Download all font files
	await download(id, isVariable, opts);

	// Generate CSS files
	await packagerV1(id, opts);
};

export { build };
