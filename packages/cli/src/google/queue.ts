import { consola } from 'consola';
import fs from 'fs-extra';
import {
	APIIconStatic,
	APIIconVariable,
	APIVariable,
	APIv2,
} from 'google-font-metadata';
import PQueue from 'p-queue';
import * as path from 'pathe';
import colors from 'picocolors';

import type { BuildOptions, CLIOptions } from '../types';
import { build } from './build';

const queue = new PQueue({ concurrency: 3 });

queue.on('idle', () => {
	consola.success(
		`All ${Object.keys(APIv2).length} Google Fonts have been processed.`,
	);
	consola.success(
		`${Object.keys(APIVariable).length} variable fonts have been processed.`,
	);
});

// Modify opts to output in correct folders
const buildPackage = async (id: string, opts: BuildOptions) => {
	consola.info(`Downloading ${id}`);
	const optsNew = {
		...opts,
		dir: path.join(opts.dir, 'google', id),
	};
	await build(id, optsNew);
	consola.success(`Finished processing ${id}`);
};

const buildVariablePackage = async (id: string, opts: BuildOptions) => {
	consola.info(`Downloading ${id} ${colors.bold(colors.yellow('[VARIABLE]'))}`);
	const optsNew = {
		...opts,
		isVariable: true,
		dir: path.join(opts.dir, 'variable', id),
	};
	await build(id, optsNew);
	consola.success(
		`Finished processing ${id} ${colors.bold(colors.yellow('[VARIABLE]'))}`,
	);
};

const buildIconPackage = async (id: string, opts: BuildOptions) => {
	consola.info(`Downloading ${id} ${colors.bold(colors.green('[ICON]'))}`);
	const optsNew = {
		...opts,
		dir: path.join(opts.dir, 'icons', id),
	};
	await build(id, optsNew);
	consola.success(
		`Finished processing ${id} ${colors.bold(colors.green('[ICON]'))}`,
	);
};

const buildVariableIconPackage = async (id: string, opts: BuildOptions) => {
	consola.info(
		`Downloading ${id} ${colors.bold(colors.yellow('[VARIABLE ICON]'))}`,
	);
	const optsNew = {
		...opts,
		isVariable: true,
		dir: path.join(opts.dir, 'variable-icons', id),
	};
	await build(id, optsNew);
	consola.success(
		`Finished processing ${id} ${colors.bold(colors.yellow('[VARIABLE ICON]'))}`,
	);
};

const testIds = [
	'akshar',
	'alegreya',
	'archivo',
	'ballet',
	'fraunces',
	'noto-sans-jp',
	'noto-serif-hk',
	'recursive',
	'roboto-flex',
];

// These fonts are too big for NPM and should not download individual subsets
const removeSubsetIds = new Set(['noto-serif-hk']);

export const processGoogle = async (opts: CLIOptions, fonts?: string[]) => {
	// Ensure all chosen dirs are created
	const outDir = path.resolve(process.cwd(), 'fonts');
	await fs.ensureDir(outDir);
	// Make tempdir for storing metadata in rebuilds
	const tmpDir = path.join(outDir, 'fontsource_temp_packages');
	await fs.ensureDir(tmpDir);

	let fontIds = fonts;
	if (opts.test) {
		fontIds = testIds;
	} else if (!fonts || fonts.length === 0) {
		fontIds = Object.keys(APIv2);
	} else {
		throw new Error('No fonts specified.');
	}

	// Normal fonts
	for (const id of fontIds) {
		// Create default options
		const buildOpts: BuildOptions = {
			dir: outDir,
			tmpDir,
			noSubset: removeSubsetIds.has(id),
			isVariable: false,
			isIcon: false,
			force: opts.force ?? false,
			ttf: opts.ttf ?? false,
		};

		if (id in APIv2) {
			// Create base font package
			void queue
				.add(() => buildPackage(id, buildOpts))
				.catch((error) => {
					consola.error(`Error processing ${id}.`);
					throw error;
				});

			// Build separate package for variable fonts
			if (APIVariable[id] !== undefined) {
				void queue
					.add(() => buildVariablePackage(id, buildOpts))
					.catch((error) => {
						consola.error(`Error processing ${id} [VARIABLE].`);
						throw error;
					});
			}
		} else {
			consola.warn(`Skipping ${id} as it is not a Google Font.`);
		}
	}

	// Icons
	if (!fonts || fonts.length === 0) {
		fontIds = Object.keys(APIIconStatic);
	}

	for (const id of fontIds) {
		// Create default options
		const buildOpts: BuildOptions = {
			dir: outDir,
			tmpDir,
			isVariable: false,
			isIcon: true,
			force: opts.force ?? false,
			ttf: opts.ttf ?? false,
		};

		if (id in APIIconStatic) {
			// Create base font package
			void queue
				.add(() => buildIconPackage(id, buildOpts))
				.catch((error) => {
					consola.error(`Error processing ${id}.`);
					throw error;
				});

			if (APIIconVariable[id] !== undefined) {
				void queue
					.add(() => buildVariableIconPackage(id, buildOpts))
					.catch((error) => {
						consola.error(`Error processing ${id} [VARIABLE].`);
						throw error;
					});
			}
		} else {
			consola.warn(`Skipping ${id} as it is not a Google Font.`);
		}
	}

	// Clean up
	await queue.onIdle();
	await fs.rm(tmpDir, { recursive: true });
};
