#!/usr/bin/env node

import { cac } from 'cac';
import { consola } from 'consola';

import { version } from '../package.json';
import { create } from './custom/create';
import { rebuild } from './custom/rebuilder';
import { verify, verifyAll } from './custom/verify';
import { buildPackages, type PackageBuildOptions } from './registry/build';

const cli = cac('fontsource');

cli
	.command('build [...fonts]', 'Build font packages from registry sources')
	.option('--inputs <directory>', 'Directory for frozen registry inputs')
	.option('--out <directory>', 'New directory for generated packages')
	.option(
		'--registry-url <url>',
		'Registry API origin (default: https://api.fontsource.org)',
	)
	.option('--revision <sha>', 'Registry snapshot revision')
	.action(async (fonts: string[], options: PackageBuildOptions) => {
		try {
			if (!options.inputs || !options.out)
				throw new Error('Both --inputs and --out are required');
			await buildPackages(fonts, options);
			consola.success(`Built packages in ${options.out}`);
		} catch (error) {
			consola.error(error);
			process.exitCode = 1;
		}
	});

cli.command('create').action(async () => {
	try {
		await create();
	} catch (error) {
		consola.error(error);
	}
});

cli
	.command('create-verify')
	.option('-i, --id <id>', 'ID of the font to verify')
	.option('--cwd <cwd>', 'Directory to run verification in')
	.option('--ci', 'Run in CI mode and throw errors instead of fancy prompts')
	.option('--all', 'Verify all fonts')
	.action(async (options) => {
		try {
			if (options.all) {
				await verifyAll();
				consola.success('All packages valid.');
			} else {
				await verify({ font: options.id, ci: options.ci, cwd: options.cwd });
			}
		} catch (error) {
			consola.error(error);
		}
	});

cli
	.command('create-rebuild')
	.option('--cwd <cwd>', 'Directory to run rebuild in')
	.action(async (options) => {
		try {
			consola.info('Rebuilding custom packages...');
			await rebuild({ cwd: options.cwd });
			consola.success('Finished rebuilding custom packages.');
		} catch (error) {
			consola.error(error);
		}
	});

cli.help();
cli.version(version);

cli.parse();
