import { confirm } from '@clack/prompts';
import consola from 'consola';
import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import latestVersion from 'latest-version';
import PQueue from 'p-queue';
import path from 'pathe';
import colors from 'picocolors';
import semver from 'semver';

import { getChanged } from './changed';
import type { BumpFlags, ChangedObj, PackageJson } from './types';
import { mergeFlags } from './utils';

interface BumpObject extends ChangedObj {
	bumpVersion: string;
	noPublish?: boolean;
}

export const isValidBumpArg = (bumpArg: string): boolean => {
	const validBumpArgs = new Set(['patch', 'minor', 'major', 'from-package']);

	// If it isn't a bumpArg in the set and isn't a semver version number
	if (!validBumpArgs.has(bumpArg) && !semver.valid(bumpArg)) {
		return false;
	}
	return true;
};

export const bumpValue = (oldVersion: string, bumpArg: string): string | false => {
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
			return arr.join('.');
		}
		if (bumpArg === 'major') {
			const newNum = Number(arr[0]) + 1;
			arr[0] = String(newNum);
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

export const verifyVersion = async (
	pkg: BumpObject,
	bumpArg: string
): Promise<BumpObject> => {
	let npmVersion: string | boolean;
	const newPkg = pkg;

	try {
		// Get latest version from NPM registry and compare if bumped version is greater than NPM
		npmVersion = await latestVersion(pkg.name);
		if (semver.gt(pkg.bumpVersion as string, npmVersion)) {
			return pkg;
		}
	} catch (error: any) {
		// If package isn't published on NPM yet, revert bump
		if (error.name === 'PackageNotFoundError') {
			newPkg.bumpVersion = newPkg.version;
		}

		return newPkg;
	}

	// If failed, do not publish
	newPkg.noPublish = true;
	if (bumpArg === 'from-package') {
		return newPkg;
	}

	throw new Error(
		colors.red(
			`${newPkg.name} version mismatch. Not publishing.\n- NPM: ${npmVersion}\n- Bumped version: ${pkg.bumpVersion}`
		)
	);
};

export const writeUpdate = async (pkg: BumpObject): Promise<void> => {
	const pkgPath = path.join(pkg.path, 'package.json');
	const pkgJson: PackageJson = await fs.readJson(pkgPath);
	pkgJson.version = pkg.bumpVersion;
	await fs.writeFile(pkgPath, stringify(pkgJson));
};

const queue = new PQueue({ concurrency: 12 });

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

	// Create bump objects with bumped version
	const bumpObjects: BumpObject[] = [];
	for (const pkg of diff) {
		const newVersion = bumpValue(pkg.version, version);
		if (!newVersion) {
			throw new Error(
				`Failed to bump version for ${pkg.name} for ${pkg.version}`
			);
		}
		const bumpObject: BumpObject = {
			...pkg,
			bumpVersion: newVersion,
		};
		bumpObjects.push(bumpObject);
	}

	// Check if package versions are free of conflicts on NPM
	const pendingObjects = [];
	for (const pkg of bumpObjects) {
		const newPkg = queue.add(() => verifyVersion(pkg, version));
		pendingObjects.push(newPkg);
	}
	// Wait for queue to finish
	const verifiedObjects = await Promise.all(pendingObjects);
	consola.info(colors.bold(colors.blue('All packages verified.')));

	// Print out all new versions and prompt user to continue
	let count = 0;
	for (const pkg of verifiedObjects) {
		if (!pkg) {
			throw new Error('Package object is undefined.');
		}
		consola.info(
			colors.magenta(`${pkg.name}: ${pkg.version} --> ${pkg.bumpVersion}`)
		);
		count += 1;
	}

	if (!options.yes) {
		const yes = await confirm({ message: `Bump ${count} packages?` });
		if (!yes) {
			throw new Error('Bump cancelled.');
		}
	} else {
		consola.info(colors.bold(colors.blue(`Bumping ${count} packages...`)));
	}

	// Update all padkage.json files
	for (const pkg of verifiedObjects) {
		if (!pkg) {
			throw new Error('Package object is undefined.');
		}

		// Skip if noPublish flag is set
		if (!pkg.noPublish) {
			await writeUpdate(pkg);
		}
	}
};
