import consola from 'consola';
import colors from 'picocolors';

import type { ChangedFlags } from './types';
import { findDiff, mergeFlags, pathToPackage } from './utils';

const changed = async (options: ChangedFlags) => {
	consola.info(colors.bold(colors.blue('Checking packages...')));
	// CLI flags take precedence over default config
	const config = await mergeFlags(options);
	const diff = await findDiff(config);
	const packages = await pathToPackage(diff);

	if (packages.length > 0) {
		consola.info(colors.bold(colors.blue('Packages changed:')));
		for (const packageJson of packages) {
			consola.info(colors.bold(`${packageJson}`));
		}
	} else {
		consola.info(colors.bold(colors.red('No packages changed.')));
	}
};

export { changed };
