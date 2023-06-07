import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import path from 'pathe';

import { sassMetadata } from '../sass/metadata';
import { sassMixins } from '../sass/mixins';
import { changelog } from '../templates/changelog';
import { packageJson } from '../templates/package';
import { readme } from '../templates/readme';
import type { Metadata } from '../types';
import { packagerCustom } from './packager';

interface CustomOptions {
	dir?: string;
	version?: string;
	publishHash?: string;
}

export const buildCustom = async (metadata: Metadata, opts?: CustomOptions) => {
	// Create the directory for the font
	const dir = opts?.dir ? path.join(opts.dir, metadata.id) : `./${metadata.id}`;
	fs.ensureDirSync(dir);
	fs.ensureDirSync(path.join(dir, '/files'));

	// Generate CSS files
	await packagerCustom(metadata, { dir });

	// Write metadata.scss
	try {
		await fs.mkdir(path.join(dir, 'scss'));
	} catch {
		// Continue as it may exist
	}
	await fs.writeFile(
		path.join(dir, 'scss/metadata.scss'),
		sassMetadata(metadata, {}, false)
	);

	// Write mixins.scss
	await fs.writeFile(path.join(dir, 'scss/mixins.scss'), sassMixins);

	// Write README.md
	await fs.writeFile(path.join(dir, 'README.md'), readme(metadata, false));

	// Write metadata.json
	await fs.writeFile(path.join(dir, 'metadata.json'), stringify(metadata));

	// Write unicode.json
	await fs.writeFile(path.join(dir, 'unicode.json'), stringify({}));

	// Write CHANGELOG.md
	await fs.writeFile(path.join(dir, 'CHANGELOG.md'), changelog);

	// Write package.json
	await packageJson(metadata, {
		dir,
		isVariable: false,
		tmpDir: '',
		force: false,
		version: opts?.version,
		publishHash: opts?.publishHash,
	});
};
