import { consola } from 'consola';
import colors from 'picocolors';
import semver from 'semver';

import { getChanged } from './changed';
import type { BumpFlags, BumpObject, ChangedList } from './types';
import { mergeFlags } from './utils';

export const isValidBumpArg = (bumpArg: string): boolean => {
	const validBumpArgs = new Set(['patch', 'minor', 'major', 'from-package']);

	// If it isn't a bumpArg in the set and isn't a semver version number
	if (!validBumpArgs.has(bumpArg) && !semver.valid(bumpArg)) {
		return false;
	}
	return true;
};

export const bumpValue = (
	oldVersion: string,
	bumpArg: string
): string | false => {
	// Check if valid semver version and if invalid return false
	const arr = semver.valid(oldVersion)?.split('.');
	if (arr) {
		if (bumpArg === 'patch') {
			const newNum = Number(arr[2]) + 1;
			arr[2] = String(newNum);
			return arr.join('.');
		}
		if (bumpArg === 'minor') {
			const newNum = Number(arr[1]) + 1;
			arr[1] = String(newNum);
			arr[2] = '0';
			return arr.join('.');
		}
		if (bumpArg === 'major') {
			const newNum = Number(arr[0]) + 1;
			arr[0] = String(newNum);
			arr[1] = '0';
			arr[2] = '0';
			return arr.join('.');
		}
		if (bumpArg === 'from-package') {
			return arr.join('.');
		}
		// Else just return number version
		if (semver.valid(bumpArg)) {
			return bumpArg;
		}

		return false;
	}
	return false;
};

export const bumpPackages = async (diff: ChangedList, version: string) => {
	// Create bump objects with bumped version
	const bumpObjects: BumpObject[] = [];
	for (const pkg of diff) {
		const newVersion = bumpValue(pkg.version, version);
		if (typeof newVersion !== 'string') {
			throw new TypeError(
				`Failed to bump version for ${pkg.name} for ${pkg.version}`
			);
		}
		const bumpObject: BumpObject = {
			...pkg,
			bumpVersion: newVersion,
		};
		bumpObjects.push(bumpObject);
	}

	// Print out all new versions and prompt user to continue
	let count = 0;
	for (const pkg of bumpObjects) {
		consola.info(
			colors.magenta(`${pkg.name}: ${pkg.version} --> ${pkg.bumpVersion}`)
		);
		count += 1;
	}
	consola.info(colors.magenta(`${count} packages will be updated.`));

	return bumpObjects;
};

export const bump = async (version: string, options: BumpFlags) => {
	if (!isValidBumpArg(version)) {
		throw new Error('Incorrect bump argument.');
	}
	consola.info(
		`${colors.bold(colors.blue('Verifying packages...'))} ${
			options.forcePublish ? colors.red(colors.bold('[FORCE]')) : ''
		}`
	);
	const config = await mergeFlags(options);
	const diff = await getChanged(config);
	await bumpPackages(diff, version);
};
