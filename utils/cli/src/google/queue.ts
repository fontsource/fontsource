import consola from 'consola';
import fs from 'fs-extra';
import { APIv2, APIVariable } from 'google-font-metadata';
import PQueue from 'p-queue';
import * as path from 'pathe';

import { CLIOptions } from '../types';

const queue = new PQueue({ concurrency: 3 });

// @ts-ignore - rollup-plugin-dts being too strict
queue.on('error', (error: Error) => {
	consola.error(error);
});

queue.on('idle', async () => {
	// Clean up directory
	await fs.rmdir(path.resolve(process.cwd(), 'fontsource_temp_packages'), {recursive: true});

	consola.success(
    `All ${Object.keys(APIv2).length} Google Fonts have been processed.`
  );
  consola.success(
    `${Object.keys(APIVariable).length} variable fonts have been processed.`
  );
});

const processQueue = (id: string) => {
	consola.info(`Downloading ${id}`);
};



// Temporary blacklist until noto-serifi-hk doesn't exceed NPM package size limits
const blacklist = new Set(['noto-serif-hk']);

const testIds = [
	'akshar',
	'alegreya',
	'archivo',
	'ballet',
	'fraunces',
	'noto-sans-jp',
	'recursive',
	'roboto-flex'
];

export const processGoogle = async (opts: CLIOptions, fonts?: string[]) => {
	// Ensure all chosen dirs are created
	const out = opts.out ?? 'fonts/google';
	await fs.ensureDir(path.resolve(process.cwd(), out));
	// Make tempdir for storing metadata in rebuilds
	await fs.ensureDir(path.resolve(process.cwd(), 'fontsource_temp_packages'));

	const fontIds = fonts ?? (opts.test ? testIds : Object.keys(APIv2));
	for (const fontId of fontIds) {
		try {
			if (!blacklist.has(fontId)) {
				queue.add(() => processQueue(fontId));
			}
		} catch (error) {
			throw new Error(`${fontId} experienced an error. ${error}`);
		}
	}
};
