import consola from 'consola';
import fs from 'fs-extra';
import {
	APIIconStatic,
	APIIconVariable,
	APIv2,
	APIVariable,
} from 'google-font-metadata';
import PQueue from 'p-queue';
import * as path from 'pathe';
import colors from 'picocolors';

import { BuildOptions, CLIOptions } from '../types';
import { build } from './build';

const queue = new PQueue({ concurrency: 3 });

// @ts-ignore - rollup-plugin-dts being too strict
queue.on('error', (error) => {
	throw new Error(error);
});

// @ts-ignore - rollup-plugin-dts being too strict
queue.on('idle', async () => {
	consola.success(
		`All ${Object.keys(APIv2).length} Google Fonts have been processed.`
	);
	consola.success(
		`${Object.keys(APIVariable).length} variable fonts have been processed.`
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
		`Finished processing ${id} ${colors.bold(colors.yellow('[VARIABLE]'))}`
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
		`Finished processing ${id} ${colors.bold(colors.green('[ICON]'))}`
	);
};

const buildVariableIconPackage = async (id: string, opts: BuildOptions) => {
	consola.info(
		`Downloading ${id} ${colors.bold(colors.yellow('[VARIABLE ICON]'))}`
	);
	const optsNew = {
		...opts,
		isVariable: true,
		dir: path.join(opts.dir, 'variable-icons', id),
	};
	await build(id, optsNew);
	consola.success(
		`Finished processing ${id} ${colors.bold(colors.yellow('[VARIABLE ICON]'))}`
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

export const processGoogle = async (opts: CLIOptions, fonts: string[]) => {
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
		};

		try {
			if (id in APIv2) {
				// Create base font package
				queue.add(() => buildPackage(id, buildOpts));

				// Build separate package for variable fonts
				if (APIVariable[id]) {
					queue.add(() => buildVariablePackage(id, buildOpts));
				}
			} else {
				consola.warn(`Skipping ${id} as it is not a Google Font.`);
			}
		} catch (error) {
			throw new Error(`${id} experienced an error. ${error}`);
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
		};

		try {
			if (id in APIIconStatic) {
				// Create base font package
				queue.add(() => buildIconPackage(id, buildOpts));

				if (APIIconVariable[id]) {
					queue.add(() => buildVariableIconPackage(id, buildOpts));
				}
			} else {
				consola.warn(`Skipping ${id} as it is not a Google Font.`);
			}
		} catch (error) {
			throw new Error(`${id} experienced an error. ${error}`);
		}
	}

	// Clean up
	await queue.onIdle();
	await fs.rm(tmpDir, { recursive: true });
};
