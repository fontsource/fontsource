import 'dotenv/config';

import { cac } from 'cac';
import { consola } from 'consola';
import {
	fetchAPI,
	fetchVariable,
	generateAxis,
	parseIcons,
	parseLicenses,
	parseVariable,
	parsev1,
	parsev2,
} from 'google-font-metadata';
import colors from 'picocolors';

import { version } from '../package.json';
import { create } from './custom/create';
import { rebuild } from './custom/rebuilder';
import { verify, verifyAll } from './custom/verify';
import { processGoogle } from './google/queue';

const cli = cac('fontsource');

cli
	.command('fetch [key]', 'Fetch parsing metadata for all fonts')
	.option('-f, --force', 'Force parse all metadata')
	.action(async (key: string, options) => {
		try {
			const finalKey = key ?? process.env.GOOGLE_API_KEY;
			if (!finalKey) {
				throw new Error('No API key provided.');
			}
			if (options.force) {
				consola.info(
					`Parsing all metadata... ${colors.bold(colors.red('[FORCE]'))}`,
				);
			} else {
				consola.info('Parsing all metadata...');
			}
			await Promise.all([fetchAPI(finalKey), fetchVariable()]);
			await parsev1(options.force, true);
			await parsev2(options.force, true);
			await generateAxis();
			await parseVariable(true);
			await parseIcons(options.force);
			await parseLicenses();
		} catch (error) {
			consola.error(error);
		}
	});

cli
	.command('build [...fonts]', 'Build font packages')
	.option('-f, --force', 'Force rebuild all packages')
	.option('-t, --test', 'Build test fonts only')
	.option('--ttf', 'Include TTF/OTF fonts')
	.action(async (fonts: string[], options) => {
		try {
			consola.info(
				`Building packages... ${
					options.force ? colors.bold(colors.red('[FORCE]')) : ''
				}`,
			);
			await processGoogle(options, fonts);
			if (options.force) {
				consola.info('Rebuilding custom packages...');
				await rebuild();
				consola.success('Finished rebuilding custom packages.');
			}
		} catch (error) {
			consola.error(error);
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
