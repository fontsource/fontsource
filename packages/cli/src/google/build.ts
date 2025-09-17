import { consola } from 'consola';
import fs from 'fs-extra';
import {
	APIIconStatic as APIIconStaticImport,
	APIIconVariable as APIIconVariableImport,
	APILicense as APILicenseImport,
	APIVariable as APIVariableImport,
	APIv2 as APIv2Import,
} from 'google-font-metadata';
import stringify from 'json-stringify-pretty-compact';
import * as path from 'pathe';

import { sassMetadata } from '../sass/metadata';
import { sassMixins } from '../sass/mixins';
import { changelog } from '../templates/changelog';
import { npmIgnore } from '../templates/npmignore';
import { packageJson } from '../templates/package';
import { readme } from '../templates/readme';
import type { BuildOptions, Metadata } from '../types';
import { licenseShort } from '../utils';
import { download } from './download';
import { generateLicense } from './license';
import { packagerIconsStatic, packagerIconsVariable } from './packager-icons';
import { packagerV1 } from './packager-v1';
import { packagerV2 } from './packager-v2';
import { packagerVariable } from './packager-variable';

// Cache imported functions
const APIIconStatic = APIIconStaticImport;
const APIIconVariable = APIIconVariableImport;
const APILicense = APILicenseImport;
const APIv2 = APIv2Import;
const APIVariable = APIVariableImport;

const build = async (id: string, opts: BuildOptions) => {
	const font = opts.isIcon ? APIIconStatic[id] : APIv2[id];
	const fontVariable = opts.isIcon ? APIIconVariable[id] : APIVariable[id];

	// Determine license metadata
	let fontLicense = APILicense[id];
	if (!fontLicense?.license) {
		consola.warn(`No license metadata found for ${id}`);
		fontLicense = {
			id,
			authors: { copyright: 'Google Inc.' },
			license: {
				type: 'SIL Open Font License, 1.1',
				url: 'http://scripts.sil.org/OFL',
			},
			original: 'Google Inc.',
		};
	}

	// Set file directories
	await fs.mkdir(opts.dir, { recursive: true });

	// Check if updated
	let changed = false;

	try {
		await fs.access(path.join(opts.dir, 'metadata.json'));
		const metadata = JSON.parse(
			await fs.readFile(path.join(opts.dir, 'metadata.json'), 'utf8'),
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
				opts.isVariable ? `${id}-variable.json` : `${id}.json`,
			);

			await fs.access(pkgJsonPath);
			await fs.copy(pkgJsonPath, tempPath);
			await fs.emptyDir(opts.dir);
			// Copy back to original folder
			await fs.copy(tempPath, pkgJsonPath);
			await fs.remove(tempPath);
		} catch {
			// Continue regardless of error since package.json may not exist
		}

		// Download all font files
		await download(id, opts);

		// Generate CSS files
		if (opts.isIcon) {
			await (opts.isVariable
				? packagerIconsVariable(id, opts)
				: packagerIconsStatic(id, opts));
		} else if (opts.isVariable) {
			await packagerVariable(id, opts);
		} else {
			// If true, skip individual subset generation as the package may be too large
			if (!opts.noSubset) {
				await packagerV1(id, opts);
			}
			await packagerV2(id, opts);
		}

		// Generate metadata
		const metadata: Metadata = {
			id,
			family: font.family,
			subsets: font.subsets,
			weights: font.weights,
			styles: font.styles,
			defSubset: font.defSubset,
			variable: fontVariable === undefined ? false : fontVariable.axes,
			lastModified: font.lastModified,
			version: font.version,
			category: font.category as Metadata['category'],
			license: {
				type:
					licenseShort(fontLicense.license.type) ?? fontLicense.license.type,
				url: fontLicense.license.url,
				attribution: fontLicense.original,
			},
			source: 'https://github.com/google/fonts',
			type: 'google',
		};

		// Write metadata.scss
		try {
			await fs.mkdir(path.join(opts.dir, 'scss'));
		} catch {
			// Continue regardless of error since directory may already exist
		}
		await fs.writeFile(
			path.join(opts.dir, 'scss/metadata.scss'),
			sassMetadata(metadata, font.unicodeRange, opts.isVariable),
		);

		// Write mixins.scss
		await fs.writeFile(path.join(opts.dir, 'scss/mixins.scss'), sassMixins);

		// Write README.md
		await fs.writeFile(
			path.join(opts.dir, 'README.md'),
			readme(metadata, opts.isVariable),
		);

		// Write unicode.json
		await fs.writeFile(
			path.join(opts.dir, 'unicode.json'),
			stringify(font.unicodeRange),
		);

		// Write CHANGELOG.md
		await fs.writeFile(path.join(opts.dir, 'CHANGELOG.md'), changelog);

		// Write LICENSE file
		await generateLicense(fontLicense, opts);

		// Write .npmignore
		if (!opts.isVariable) {
			await fs.writeFile(path.join(opts.dir, '.npmignore'), npmIgnore);
		}

		// Write metadata.json
		await fs.writeFile(
			path.join(opts.dir, 'metadata.json'),
			stringify(metadata),
		);

		// Write package.json
		await packageJson(metadata, opts);
	}
};

export { build };
