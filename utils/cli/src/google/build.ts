import fs from 'fs-extra';
import { APILicense, APIv2, APIVariable } from 'google-font-metadata';
import stringify from 'json-stringify-pretty-compact';
import * as path from 'pathe';

import { changelog } from '../templates/changelog';
import { packageJson } from '../templates/package';
import { readme } from '../templates/readme';
import { BuildOptions, Metadata } from '../types';
import { download } from './download';
import { packagerV1 } from './packager-v1';
import { packagerV2 } from './packager-v2';

const build = async (id: string, opts: BuildOptions) => {
	const font = APIv2[id];
	const fontVariable = APIVariable[id];
	const fontLicense = APILicense[id];

	// Set file directories
	await fs.mkdir(opts.dir, { recursive: true });

	// Check if updated
	let changed = false;

	try {
		await fs.access(path.join(opts.dir, 'metadata.json'));
		const metadata = JSON.parse(
			await fs.readFile(path.join(opts.dir, 'metadata.json'), 'utf8')
		);
		changed = metadata.lastModified !== font.lastModified;
	} catch {
		changed = true;
	}

	// If needs updating, preserve package.json in temporary folder till later
	if (changed || opts.force) {
		try {
			// Copy to temp folder
			const pkgJsonPath = path.join(opts.dir, 'package.json');
			const tempPath = path.join(
				opts.tmpDir,
				opts.isVariable ? `${id}-variable.json` : `${id}.json`
			);

			await fs.access(pkgJsonPath);
			await fs.copy(pkgJsonPath, tempPath);
			await fs.emptyDir(opts.dir);
			// Copy back to original folder
			await fs.copy(tempPath, pkgJsonPath);
			await fs.remove(tempPath);
		} catch {
			// Continue regardless of error
		}
	}

	// Download all font files
	await download(id, opts);

	// Generate CSS files
	if (opts.isVariable) {
		await packagerVariable(id, opts);
	} else {
		await packagerV1(id, opts);
		await packagerV2(id, opts);
	}

	// TODO: Generate SCSS

	// Generate metadata
	const metadata: Metadata = {
		id,
		family: font.family,
		subsets: font.subsets,
		weights: font.weights,
		styles: font.styles,
		defSubset: font.defSubset,
		variable: fontVariable.axes ?? false,
		lastModified: font.lastModified,
		version: font.version,
		category: font.category as Metadata['category'],
		license: {
			type: fontLicense.license.type,
			url: fontLicense.license.url,
			attribution: fontLicense.original,
		},
		source: 'https://github.com/google/fonts',
		type: 'google',
	};

	// Write README.md
	await fs.writeFile(path.join(opts.dir, 'README.md'), readme(metadata));

	// Write metadata.json
	await fs.writeFile(path.join(opts.dir, 'metadata.json'), stringify(metadata));

	// Write unicode.json
	await fs.writeFile(
		path.join(opts.dir, 'unicode.json'),
		stringify(font.unicodeRange)
	);

	// Write CHANGELOG.md
	await fs.writeFile(path.join(opts.dir, 'CHANGELOG.md'), changelog);

	// Write package.json
	await packageJson(metadata, opts.dir);
};

export { build };
