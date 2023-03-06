import 'dotenv/config';

import { cac } from 'cac';
import consola from 'consola';
import {
	fetchAPI,
	fetchVariable,
	generateAxis,
	parseLicenses,
	parsev1,
	parsev2,
	parseVariable } from 'google-font-metadata';
import colors from 'picocolors';

import { version } from '../package.json';
import { create } from './custom/create';
import { verify } from './custom/verify';
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
					`Parsing all metadata... ${colors.bold(colors.red('[FORCE]'))}`
				);
			} else {
				consola.info('Parsing all metadata...');
			}
			await Promise.all([fetchAPI(finalKey), fetchVariable()]);
			await parsev1(options.force, false);
			await parsev2(options.force, false);
			await generateAxis();
			await parseVariable(false);
			await parseLicenses();
		} catch (error) {
			consola.error(error);
		}
	});

cli
	.command('build [...fonts]', 'Build font packages')
	.option('-v, --variable', 'Only build variable fonts')
	.option('-f, --force', 'Force rebuild all packages')
	.option('-t, --test', 'Build test fonts only')
	.action(async (fonts: string[], options) => {
		try {
			consola.info(`Building packages... ${options.force ? colors.bold(colors.red('[FORCE]')) : ''}`);
			await processGoogle(options, fonts);
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

cli.command('create-verify').action(async () => {
	try {
		await verify();
	} catch (error) {
		consola.error(error);
	}
});

cli.help();
cli.version(version);

cli.parse();
