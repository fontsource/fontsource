import consola from 'consola';
import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import * as path from 'pathe';

// eslint-disable-next-line import/no-relative-packages
import { version as mainPkgRepoVersion } from '../../../../package.json';
import { Metadata } from '../types';

const licenseMap = {
	'apache license, version 2.0': 'Apache-2.0',
	'sil open font license, 1.1': 'OFL-1.1',
	'ubuntu font license, 1.0': 'UFL-1.0',
};

const template = (
	{ id, family, license, type, variable }: Metadata,
	oldVersion?: string
) => {
	const licenseShort =
		licenseMap[license.type.toLowerCase() as keyof typeof licenseMap];
	if (!licenseShort) {
		consola.warn(`Unknown license type: ${license.type}`);
	}

	return {
		name: variable ? `@fontsource/${id}/variable` : `@fontsource/${id}`,
		version: oldVersion ?? mainPkgRepoVersion,
		description: `Self-host the ${family} font in a neatly bundled NPM package.`,
		main: 'index.css',
		publishConfig: { access: 'public' },
		keywords: [
			'fontsource',
			'font',
			'font family',
			'google fonts',
			id,
			family,
			'css',
			'sass',
			'front-end',
			'web',
			'typeface',
		],
		author: 'Google Inc.',
		license: licenseShort ?? license.type,
		homepage: `https://fontsource.org/fonts/${id}`,
		repository: {
			type: 'git',
			url: 'https://github.com/fontsource/fontsource.git',
			directory: `fonts/${type}/${id}`,
		},
	};
};

const packageJson = async (metadata: Metadata, fontDir: string) => {
	let oldVersion;
	try {
		await fs.access(path.join(fontDir, 'package.json'));
		oldVersion = JSON.parse(
			await fs.readFile(path.join(fontDir, 'package.json'), 'utf8')
		).version;
	} catch {
		// Continue
	}

	const file = template(metadata, oldVersion);
	await fs.writeFile(path.join(fontDir, 'package.json'), stringify(file));
};

export { packageJson };
