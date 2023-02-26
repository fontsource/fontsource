import consola from 'consola';
import { hashElement } from 'folder-hash';
import fs from 'fs-extra';
import path from 'pathe';
import colors from 'picocolors';

import type { ChangedFlags, Context, PackageJson } from './types';
import { getPackages, mergeFlags } from './utils';

interface ChangedList {
	[key: string]: {
		name: string;
		path: string;
		hash: string;
	};
}

const getHash = async (packagePath: string) => {
	const hashOptions = {
		folders: { exclude: ['.*', 'node_modules'] },
		files: { exclude: ['package.json'] },
	};

	const hash = await hashElement(packagePath, hashOptions);
	return hash.hash;
};

// Iterate through all packages in directory and return a list of changed packages
const getChanged = async (ctx: Context) => {
	const changedList: ChangedList = {};

	for (const packageDir of ctx.packages) {
		const packages = await getPackages(packageDir);
		for (const packageName of packages) {
			const packagePath = path.join(packageDir, packageName);

			// Check if package.json exists
			const packageJson: PackageJson = await fs.readJson(
				path.join(packagePath, 'package.json')
			);

			// Get hash of current package and compare with old hash
			const hash = await getHash(packagePath);
			if (packageJson.publishHash !== hash) {
				changedList[packageName] = {
					name: packageJson.name,
					hash,
					path: packagePath,
				};
			}
		}
	}

	return changedList;
};

const changed = async (options: ChangedFlags) => {
	consola.info(colors.bold(colors.blue('Checking packages...')));
	// CLI flags take precedence over default config
	const config = await mergeFlags(options);
	const diff = await getChanged(config);

	if (Object.keys(diff).length > 0) {
		consola.info(colors.bold(colors.blue('Packages changed:')));
		for (const key of Object.keys(diff)) {
			consola.info(colors.bold(diff[key].name));
		}
	} else {
		consola.info(colors.bold(colors.red('No packages changed.')));
	}
};

export { changed, getChanged };
