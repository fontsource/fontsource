import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import path from 'pathe';

import { changelog } from '../templates/changelog';
import { packageJson } from '../templates/package';
import { readme } from '../templates/readme';
import type { Metadata } from '../types';
import { packagerCustom } from './packager';

export const buildCustom = async (metadata: Metadata) => {
	// Create the directory for the font
	const dir = `./${metadata.id}`;
	fs.ensureDirSync(dir);
	fs.ensureDirSync(path.join(dir, '/files'));

	// Generate CSS files
	await packagerCustom(metadata);

	// TODO: Generate SCSS

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
	});
};
