import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import * as path from 'pathe';

import { BuildOptions, Metadata } from '../types';

interface ExistingData {
	oldVersion?: string;
	publishHash?: string;
}

const template = (
	{ id, family, license, type }: Metadata,
	isVariable: boolean,
	existing?: ExistingData
) => ({
	name: isVariable ? `@fontsource-variable/${id}` : `@fontsource/${id}`,
	version:
		existing?.oldVersion ??
		JSON.parse(
			fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
		).version,
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
	author: type === 'other' ? license.attribution : 'Google Inc.',
	license: license.type,
	homepage: `https://fontsource.org/fonts/${id}`,
	repository: {
		type: 'git',
		url: 'https://github.com/fontsource/font-files.git',
		directory: `fonts/${isVariable ? 'variable' : type}/${id}`,
	},
	// If publish hash exists, add it to the package.json
	...(existing?.publishHash && { publishHash: existing.publishHash }),
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

	const file = template(metadata, opts.isVariable, {
		oldVersion: opts.version ?? oldVersion,
		publishHash: opts.publishHash,
	});
	await fs.writeFile(path.join(opts.dir, 'package.json'), stringify(file));
};

export { packageJson };
