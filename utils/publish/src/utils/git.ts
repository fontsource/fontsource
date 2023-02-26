import { execa } from 'execa';
import * as path from 'pathe';

import type { Config } from '../types';

const getHeadCommit = async (): Promise<string> => {
	const { stdout } = await execa('git', ['rev-parse', 'HEAD']);
	return stdout;
};

// Parse git commands to find arr of changed packages
const findDiff = async (
	{ packages, ignoreExtension = [], commitFrom, commitTo = 'HEAD' }: Config,
	forcePublish = false
): Promise<string[]> => {
	if (forcePublish) {
		const stream = await execa('git', ['rev-list', '--max-parents=0', 'HEAD']);

		// eslint-disable-next-line no-param-reassign
		commitFrom = stream.stdout;
		// eslint-disable-next-line no-param-reassign
		commitTo = 'HEAD';
	}
	// Diffs the two commmits
	const files = await execa('git', [
		'diff',
		'--name-only',
		commitFrom,
		commitTo,
	]);

	// Files only returns a single string of all of stdout
	const filteredFiles = files.stdout.split('\n');

	// Removes all diffs that do not match the configuration
	const filteredPaths = filteredFiles.filter(pathNew => {
		let match = false;

		for (const packagePath of packages) {
			// Only allow paths that match config.packages
			if (pathNew.startsWith(packagePath)) {
				match = true;
			}

			// Reject any that match config.ignoreExtension
			for (const matchingExtension of ignoreExtension) {
				if (pathNew.endsWith(matchingExtension)) {
					match = false;
				}
			}

			// Ignore package.json
			if (pathNew.endsWith('package.json')) {
				match = false;
			}
		}

		return match;
	});

	// Return package.json names
	const dirPaths = filteredPaths
		// Remove filenames and only show dirs
		.map(filePath => path.dirname(filePath))
		// Remove any files that are included in the packages dir but not in a separate subdir
		.filter(dir => !packages.includes(`${dir}/`))
		// Remove any subdirectories within each package directory
		.map(dir => {
			let dirName: string[] = [];
			for (const packagePath of packages) {
				if (dir.startsWith(packagePath)) {
					dirName = [packagePath, dir.replace(packagePath, '').split('/')[0]];
				}
			}
			return path.join(dirName[0], dirName[1]);
		});

	// Multiple changed files in same dir would produce multiple duplicate dirPaths
	return [...new Set(dirPaths)];
};

export { findDiff, getHeadCommit };
