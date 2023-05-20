import { consola } from 'consola';
import fs from 'fs-extra';
import path from 'pathe';
import colors from 'picocolors';

import type { ChangedFlags, ChangedList, Context, PackageJson } from './types';
import { getPackages, mergeFlags } from './utils';
import { getHash, hasher } from './hash';
import PQueue from 'p-queue';

// Iterate through all packages in directory and return a list of changed packages
const getChanged = async (ctx: Context) => {
	const changedList: ChangedList = [];
	// Generate 4 hasher instances
	const hashers = await Promise.all([hasher(), hasher(), hasher(), hasher()]);
	const queue = new PQueue({ concurrency: 8 });

	const handleHash = async (
		packagePath: string,
		packageJson: PackageJson,
		hasher: number
	) => {
		// Get hash of current package and compare with old hash
		const hash = await getHash(packagePath, hashers[hasher]);
		if (packageJson.publishHash !== hash || ctx.forcePublish) {
			changedList.push({
				name: packageJson.name,
				hash,
				path: packagePath,
				version: packageJson.version,
			});
		}
	};

	for (const packageDir of ctx.packages) {
		const packages = await getPackages(packageDir);
		let hasherIndex = 0;
		for (const packageName of packages) {
			const packagePath = path.join(packageDir, packageName);

			// Check if package.json exists
			const packageJson: PackageJson = await fs.readJson(
				path.join(process.cwd(), packagePath, 'package.json')
			);

			queue.add(() => handleHash(packagePath, packageJson, hasherIndex++));

			if (hasherIndex === 4) hasherIndex = 0;
		}
	}

	await queue.onIdle();
	return changedList;
};

const changed = async (options: ChangedFlags) => {
	consola.info(colors.bold(colors.blue('Checking packages...')));
	// CLI flags take precedence over default config
	const config = await mergeFlags(options);
	const diff = await getChanged(config);

	if (diff.length > 0) {
		consola.info(colors.bold(colors.blue('Packages changed:')));
		for (const item of diff) {
			consola.info(item.name);
		}
		consola.info(
			colors.bold(colors.magenta(`${diff.length} packages changed.`))
		);
	} else {
		consola.info(colors.bold(colors.red('No packages changed.')));
	}
};

export { changed, getChanged };
