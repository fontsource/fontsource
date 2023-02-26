import consola from 'consola';
import colors from 'picocolors';
import prompts from 'prompts';
import semver from 'semver';

import type { BumpFlags, BumpObject } from './types';
import { bumpCheck, findDiff, mergeFlags, pathToPackage } from './utils';

const isValidBumpArg = (bumpArg: string): boolean => {
	const validBumpArgs = new Set(['patch', 'minor', 'major', 'from-package']);

	// If it isn't a bumpArg in the set and isn't a semver version number
	if (!validBumpArgs.has(bumpArg) && !semver.valid(bumpArg)) {
		return false;
	}
	return true;
};

const bumpValue = (oldVersion: string, bumpArg: string): string | false => {
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

const createBumpObject = async (diff: string[], bumpArg: string): BumpObject[] => {
	const bumpObjectArr: BumpObject[] = [];
	const packageJsons = await pathToPackage(diff);

	let index = 0;
	for (const filePath of diff) {
		const packageJson = packageJsons[index];
		const bumpedVersion = bumpValue(packageJson.version, bumpArg);

		// If bumped version returns false, set failedValidation to true
		const bumpObject: BumpObject = bumpedVersion
			? {
				packageFile: packageJson,
				packagePath: filePath,
				bumpedVersion,
			}
			: {
				packageFile: packageJson,
				packagePath: filePath,
				bumpedVersion,
				noPublish: true,
			};

		bumpObjectArr.push(bumpObject);
		index += 1;
	}

	return bumpObjectArr;
};

const bumpVerify = async (
	bumpFlagVar: FlagsBumpReturn,
	bumpObjects: BumpObject[],
	bumpArg: string
): Promise<BumpObject[]> => {
	// Skip checking if no verify flag
	let checkedObjects: BumpObject[];
	if (bumpFlagVar.noVerify) {
		consola.info(colors.red('Skipping version verification due to noVerify flag...'));
		checkedObjects = bumpObjects;
	} else {
		checkedObjects = await bumpCheck(bumpObjects, bumpArg);
	}

	if (checkedObjects.length === 0) {
		throw new Error(colors.bold(colors.red('No packages to update found.')));
	}

	consola.info(colors.bold(colors.blue(('Changed packages:'))));
	for (const bumpObject of checkedObjects) {
		consola.info(
			colors.magenta(
				`${bumpObject.packageFile.name}: ${bumpObject.packageFile.version} --> ${bumpObject.bumpedVersion}`
			)
		);
	}

	if (!bumpFlagVar.skipPrompt) {
		// Filter out any objects with the noPublish flag attached to them
		checkedObjects = checkedObjects.filter(
			bumpObject => !bumpObject.noPublish
		);
		const input = await prompts({
			type: 'confirm',
			name: 'value',
			message: 'Bump packages?',
			initial: true
		});
		if (!input.value) {
			throw new Error(colors.bold(colors.red('Bump cancelled.')));
		}
	}

	return checkedObjects;
};

const bump = async (version: string, options: BumpFlags) => {
	if (!isValidBumpArg(version)) {
		throw new Error('Incorrect bump argument.');
	}
	consola.info(`${colors.bold(colors.blue('Bumping packages...'))} ${options.forcePublish ? colors.red(colors.bold('[FORCE]')) : ''}`);
	const config = await mergeFlags(options);
	const diff = await findDiff(config);
	const bumpObjects = await createBumpObject(diff, version);
	const checkedObjects = await bumpCliPrint(
		bumpFlagVars,
		bumpObjects,
		bumpArg
	);
};

export { bump };
