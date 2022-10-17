import 'dotenv/config';

import { cac } from 'cac';
import consola from 'consola';
import colors from 'picocolors';

import { version } from '../package.json';

const cli = cac('fontsource');

cli
	.command('fetch [key]', 'Fetch parsing metadata for all fonts')
	.action(async (key: string) => {
		try {
			const finalKey = key ?? process.env.GOOGLE_FONT_API_KEY;
			if (!finalKey) {
                throw new Error('No API key provided.');
            }
		} catch (error) {
			consola.error(error);
		}
	});

cli
	.command('build [...fonts]', 'Build font packages')
	.option('--google', 'Only build Google Fonts')
	.option('--generic', 'Only build Generic Fonts')
    .option('-f, --force', 'Force rebuild all packages')
	.action(async (fonts: string[], options) => {
		try {
            if (fonts) {
                console.log('build')
            } else {
                console.log(options)
            }
		} catch (error) {
			consola.error(error);
		}
	});


cli.help();
cli.version(version);

cli.parse();