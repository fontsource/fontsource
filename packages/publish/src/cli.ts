import { cac } from 'cac';
import { consola } from 'consola';
import * as dotenv from 'dotenv';
import colors from 'picocolors';

import { version as packageJsonVersion } from '../package.json';
import { bump } from './bump';
import { changed } from './changed';
import { init } from './init';
import { publishPackages } from './publish';
import type { BumpFlags, ChangedFlags, PublishFlags } from './types';

dotenv.config();

const cli = cac('fontsource-publish');

cli
	.command('init', 'Add config file with default variables in root')
	.action(async () => {
		try {
			await init();
			consola.success(colors.green('font-publish.json has been created.'));
		} catch (error) {
			consola.error(error);
			process.exit(1);
		}
	});

cli
	.command(
		'changed',
		'Calculates hashes and lists all packages that have changes made to them',
	)
	.option('--force', 'Force publish ALL packages regardless if changed or not')
	.option('--commit-message', 'Change commit message')
	.option('--packages', 'Package directory')
	.action(async (opts: ChangedFlags) => {
		try {
			await changed(opts);
		} catch (error) {
			consola.error(error);
			process.exit(1);
		}
	});

cli
	.command('bump <version>', 'Bumps the version of all changed packages.')
	.option('--force', 'Force bump ALL packages regardless if changed or not')
	.option(
		'--yes',
		'Skips confirmation to write the bump changes to package.json. Useful in CI',
	)
	.option('--commit-message', 'Change commit message')
	.option('--packages', 'Package directory')
	.action(async (version: string, opts: BumpFlags) => {
		try {
			await bump(version, opts);
			consola.success(
				colors.green(colors.bold('Successfully bumped packages.')),
			);
		} catch (error) {
			consola.error(error);
			process.exit(1);
		}
	});

cli
	.command('publish <version>', 'Publishes all packages to NPM.')
	// Carry over bump and changed command options
	.option('--force', 'Force bump ALL packages regardless if changed or not')
	.option(
		'--yes',
		'Skips confirmation to write the bump changes to package.json. Useful in CI',
	)
	.option('--commit-message', 'Change commit message')
	.option('--packages', 'Package directory')
	.action(async (version: string, opts: PublishFlags) => {
		try {
			await publishPackages(version, opts);
			consola.success(
				colors.green(colors.bold('Successfully published all packages.')),
			);
		} catch (error) {
			consola.error(error);
			process.exit(1);
		}
	});

cli.help();
cli.version(packageJsonVersion);

cli.parse();
