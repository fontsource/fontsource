import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import * as path from 'pathe';

// eslint-disable-next-line import/no-relative-packages
import { version as mainPkgRepoVersion } from '../../../../package.json';
import { BuildOptions,Metadata } from '../types';

const template = (
	{ id, family, license, type, variable }: Metadata,
	oldVersion?: string
) => ({
		name: variable ? `@fontsource-variable/${id}` : `@fontsource/${id}`,
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
	author: type === 'other' ? license.attribution : 'Google Inc.',
		license: license.type,
		homepage: `https://fontsource.org/fonts/${id}`,
		repository: {
			type: 'git',
			url: 'https://github.com/fontsource/fontsource.git',
			directory: `fonts/${type}/${id}`,
		},
	});

const packageJson = async (metadata: Metadata, opts: BuildOptions) => {
	let oldVersion;
	try {
		await fs.access(path.join(opts.dir, 'package.json'));
		oldVersion = JSON.parse(
			await fs.readFile(path.join(opts.dir, 'package.json'), 'utf8')
		).version;
	} catch {
		// Continue
	}

	const file = template(metadata, oldVersion);
	await fs.writeFile(path.join(opts.dir, 'package.json'), stringify(file));
};

export { packageJson };
