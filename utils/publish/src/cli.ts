import { cac } from 'cac';
import consola from 'consola';
import * as dotenv from 'dotenv';
import colors from 'picocolors';

import { version as packageJsonVersion } from '../package.json';
import { bump } from './bump';
import { changed } from './changed';
import { init } from './init';
import { publish } from './publish';
import { BumpFlags, ChangedFlags, PublishFlags } from './types';

dotenv.config();

const cli = cac('mass-publish');

cli.command('init', 'Add config file with default variables in root')
	.action(async () => {
		try {
			await init();
			consola.success(colors.green('mass-publish.json has been created.'));
		} catch (error) { consola.error(error); }
	});

cli.command('changed', 'Runs git diff and lists all packages that have changes made to them')
	.option('--commit-from', 'Commit SHA to compare differences from')
	.option('--commit-to', 'Commit SHA to compare differences to')
	.option('--commit-message', 'Change commit message')
	.option('--ignore-extension', 'Ignore extensions')
	.option('--packages', 'Package directory')
	.action(async (opts: ChangedFlags) => {
		try {
			await changed(opts);
			consola.success(colors.green(colors.bold('Success')));
		} catch (error) {
			consola.error(error);
		}
	});


cli.command('bump <version>', 'Bumps the version of all changed packages.')
	.option('--no-verify', 'Skips verifying with NPM registry whether the package version isn\'t taken')
	.option('--force-publish', 'Force bump ALL packages regardless if changed or not')
	.option('--yes', 'Skips confirmation to write the bump changes to package.json. Useful in CI')
	// Carry over changed command options
	.option('--commit-from', 'Commit SHA to compare differences from')
	.option('--commit-to', 'Commit SHA to compare differences to')
	.option('--commit-message', 'Change commit message')
	.option('--ignore-extension', 'Ignore extensions')
	.option('--packages', 'Package directory')
	.action(async (version: string, opts: BumpFlags) => {
		try {
			await bump(version, opts);
			consola.success(colors.green(colors.bold('Successfully bumped x packages.')));
		} catch (error) {
			consola.error(error);
		}
	});

cli.command('publish <version>', 'Publishes all packages to NPM.')
	// Carry over bump and changed command options
	.option('--no-verify', 'Skips verifying with NPM registry whether the package version isn\'t taken')
	.option('--force-publish', 'Force bump ALL packages regardless if changed or not')
	.option('--yes', 'Skips confirmation to write the bump changes to package.json. Useful in CI')
	.option('--commit-from', 'Commit SHA to compare differences from')
	.option('--commit-to', 'Commit SHA to compare differences to')
	.option('--commit-message', 'Change commit message')
	.option('--ignore-extension', 'Ignore extensions')
	.option('--packages', 'Package directory')
	.action(async (opts: PublishFlags) => {
		try {
			await publish(opts);
			consola.success(colors.green(colors.bold('Successfully published all x packages.')));
		} catch (error) {
			consola.error(error);
		}
	});

cli.help();
cli.version(packageJsonVersion);

cli.parse();
