import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import * as path from 'pathe';

import BASE_VERSION from '../../version';
import type { BuildOptions, Metadata } from '../types';

interface ExistingData {
	oldVersion?: string;
	publishHash?: string;
}

const template = (
	{ id, family, license, type }: Metadata,
	isVariable: boolean,
	existing?: ExistingData,
) => ({
	name: isVariable ? `@fontsource-variable/${id}` : `@fontsource/${id}`,
	version: existing?.oldVersion ?? BASE_VERSION,
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
		'variable',
	],
	exports: {
		'.': {
			sass: './index.css',
			default: './index.css',
		},
		'./LICENSE': './LICENSE',
		'./*': {
			sass: './*.css',
			default: './*.css',
		},
		'./*.css': {
			sass: './*.css',
			default: './*.css',
		},
		'./files/*': {
			sass: './files/*',
			default: './files/*',
		},
		'./files/*.woff': {
			sass: './files/*.woff',
			default: './files/*.woff',
		},
		'./files/*.woff2': {
			sass: './files/*.woff2',
			default: './files/*.woff2',
		},
		'./package.json': './package.json',
		'./metadata.json': './metadata.json',
		'./unicode.json': './unicode.json',
		'./scss': {
			sass: './scss/metadata.scss',
		},
	},
	author: type === 'other' ? license.attribution : 'Google Inc.',
	license: license.type,
	homepage: `https://fontsource.org/fonts/${id}`,
	funding: 'https://github.com/sponsors/ayuhito',
	repository: {
		type: 'git',
		url: 'git+https://github.com/fontsource/font-files.git',
		directory: `fonts/${isVariable ? 'variable' : type}/${id}`,
	},
	// If publish hash exists, add it to the package.json
	...(existing?.publishHash && { publishHash: existing.publishHash }),
});

const packageJson = async (metadata: Metadata, opts: BuildOptions) => {
	let oldVersion: string | undefined;
	let oldPublishHash: string | undefined;
	try {
		await fs.access(path.join(opts.dir, 'package.json'));
		const file = await fs.readJson(path.join(opts.dir, 'package.json'));
		oldVersion = file.version;
		oldPublishHash = file.publishHash;
	} catch {
		// Continue
	}

	const file = template(metadata, opts.isVariable, {
		oldVersion: opts.version ?? oldVersion,
		publishHash: opts.publishHash ?? oldPublishHash,
	});
	await fs.writeFile(path.join(opts.dir, 'package.json'), stringify(file));
};

export { packageJson };
