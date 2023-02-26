import consola from 'consola';
import latestVersion from 'latest-version';
import PQueue from 'p-queue';
import colors from 'picocolors';
import semver from 'semver';

import type { BumpObject } from '../types';

const queue = new PQueue({ concurrency: 12 });

const validate = async (item: BumpObject, bumpArg: string): Promise<BumpObject | Error> => {
	let npmVersion: string | boolean;
	const newItem = item;

	try {
		// Get latest version from NPM registry and compare if bumped version is greater than NPM
		npmVersion = await latestVersion(item.packageFile.name);
		if (semver.gt(item.bumpedVersion as string, npmVersion)) {
			return item;
		}
	} catch (error) {
		// If package isn't published on NPM yet, revert bump
		// @ts-ignore - I cannot be bothered to type this properly
		if (error.name === 'PackageNotFoundError') {
			newItem.bumpedVersion = newItem.packageFile.version;
		} else {
			consola.error(error);
		}

		return newItem;
	}

	// If failed, do not publish

	newItem.noPublish = true;
	if (bumpArg === 'from-package') {
		return newItem;
	}

	return new Error(
		colors.red(
			`${newItem.packageFile.name} version mismatch. Not publishing.\n- NPM: ${npmVersion}\n- Bumped version: ${item.bumpedVersion}`
		)
	);
};

const bumpCheck = async (
	bumpList: BumpObject[],
	bumpArg: string
): Promise<BumpObject[]> => {
	const objects = [];

	for (const item of bumpList) {
		const validatedItem = queue.add(() => validate(item, bumpArg));
		objects.push(validatedItem);
	}

	const checkedList = await Promise.all(objects);
	const errors: Error[] = [];
	for (const item of checkedList) {
		if (item instanceof Error) {
			errors.push(item);
		}
	}

	if (errors.length > 0) throw new AggregateError(errors, 'Bump check failed.');
	return checkedList as unknown as Promise<BumpObject[]>;
};

export { bumpCheck };
