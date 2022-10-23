import consola from 'consola';
import fs from 'fs-extra';
import { APIv2, APIVariable } from 'google-font-metadata';
import PQueue from 'p-queue';
import * as path from 'pathe';

import { BuildOptions, CLIOptions } from '../types';
import { build } from './build';

const queue = new PQueue({ concurrency: 3 });

// @ts-ignore - rollup-plugin-dts being too strict
queue.on('error', (error: Error) => {
	consola.error(error);
});

queue.on('idle', async () => {
	// Clean up directory
	await fs.rmdir(path.resolve(process.cwd(), 'fontsource_temp_packages'), {
		recursive: true,
	});

	consola.success(
		`All ${Object.keys(APIv2).length} Google Fonts have been processed.`
	);
	consola.success(
		`${Object.keys(APIVariable).length} variable fonts have been processed.`
	);
});

const buildPackage = async (id: string, opts: BuildOptions) => {
	consola.info(`Downloading ${id}`);
	await build(id, opts);
	consola.success(`Finished processing ${id}`);
};

const buildVariablePackage = async (id: string, opts: BuildOptions) => {
	consola.info(`Downloading ${id} variable font`);
	await build(id, opts);
	consola.success(`Finished processing ${id} variable`);
};

const testIds = [
	'akshar',
	'alegreya',
	'archivo',
	'ballet',
	'fraunces',
	'noto-sans-jp',
	'recursive',
	'roboto-flex',
];

export const processGoogle = async (opts: CLIOptions, fonts?: string[]) => {
	// Ensure all chosen dirs are created
	const outDir = path.resolve(process.cwd(), opts.out ?? 'fonts/google');
	await fs.ensureDir(outDir);
	// Make tempdir for storing metadata in rebuilds
	const tmpDir = path.join(outDir, 'fontsource_temp_packages');
	await fs.ensureDir(tmpDir);

	const fontIds = fonts ?? (opts.test ? testIds : Object.keys(APIv2));
	for (const id of fontIds) {
		// Create default options
		const buildOpts: BuildOptions = {
			dir: path.join(outDir, id),
			tmpDir,
			isVariable: false,
			force: false,
		};

		try {
			// Create base font package
			queue.add(() => buildPackage(id, buildOpts));

			// Build separate package for variable fonts
			if (APIVariable[id]) {
				// Change build options to use separate variable package name
				buildOpts.isVariable = true;
				buildOpts.dir = path.join(outDir, id, 'variable');

				queue.add(() => buildVariablePackage(id, buildOpts));
			}
		} catch (error) {
			throw new Error(`${id} experienced an error. ${error}`);
		}
	}
};
