import consola from 'consola';
import colors from 'picocolors';

import { bump } from './bump';
import { changed } from './changed';
import type { PublishFlags } from './types';
import { mergeFlags } from './utils';

const publish = async (options: PublishFlags) => {
	consola.info(`${colors.bold(colors.blue('Publishing packages...'))} ${options.forcePublish ? colors.red(colors.bold('[FORCE]')) : ''}`);


	const config = await mergeFlags(options);
};

export { publish };
