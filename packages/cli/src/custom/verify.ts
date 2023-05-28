/* eslint-disable consistent-return */
import { cancel, group, intro, outro, text } from '@clack/prompts';
import fs from 'fs-extra';
import path from 'pathe';
import colors from 'picocolors';

import { Metadata } from '../types';
import { consola } from 'consola';
import { getDirectories } from './utils';

export const verifyFilenames = async (metadata: Metadata, dir: string) => {
	// Read all the filenames in the files directory
	const filenames = await fs.readdir(path.join(dir, 'files'));

	// Make sure filenames is not empty
	if (filenames.length === 0) {
		throw new Error('No files found in the files directory.');
	}

	// Generate a list of expected filenames
	const expectedFilenames: string[] = [];

	// Iterate over all subsets
	for (const subset of metadata.subsets) {
		// Iterate over all weights
		for (const weight of metadata.weights) {
			// Iterate over all styles
			for (const style of metadata.styles) {
				// Add the expected filename to the list
				expectedFilenames.push(
					`${metadata.id}-${subset}-${weight}-${style}.woff2`,
					`${metadata.id}-${subset}-${weight}-${style}.woff`
				);
			}
		}
	}

	// Check if all expected filenames are present and show all missing or non-matching filenames
	const missingFilenames = expectedFilenames.filter(
		(filename) =>
			!filenames.includes(filename) ||
			!filename.endsWith('.ttf') ||
			!filename.endsWith('.otf')
	);
	if (missingFilenames.length > 0) {
		throw new Error(
			`The following files are missing: ${missingFilenames.join(
				', '
			)}\n\n\tPlease ensure the file names match the format "${
				metadata.id
			}-subset-weight-style.extension"\n\tExample: "${
				metadata.id
			}-latin-400-normal.woff2" or "${metadata.id}-latin-ext-700-italic.woff"`
		);
	}

	// Check if all filenames are expected and show all non-matching filenames
	const nonMatchingFilenames = filenames.filter(
		(filename) => !expectedFilenames.includes(filename)
	);
	if (nonMatchingFilenames.length > 0) {
		throw new Error(
			`The following files are not expected: ${nonMatchingFilenames.join(
				', '
			)}\n\n\tPlease ensure the file names match the format "${
				metadata.id
			}-subset-weight-style.extension"\n\tExample: "${
				metadata.id
			}-latin-400-normal.woff2" or "${metadata.id}-latin-ext-700-italic.woff"`
		);
	}
};

interface VerifyProps {
	font?: string;
	ci?: boolean;
	cwd?: string;
}

export const verify = async ({ font, ci, cwd }: VerifyProps): Promise<void> => {
	let currentDir = process.cwd();
	if (cwd) {
		currentDir = cwd;
	}

	let id = font;
	if (ci && !id) {
		throw new Error('No font ID provided. This is needed in CI.');
	}

	if (!id) {
		intro(colors.cyan(colors.bold('fontsource')));
		const cfg = await group({
			id: () =>
				text({
					message: colors.bold('What is the ID of the font?'),
					placeholder: 'noto-sans-jp',
					validate(value) {
						if (!value) return 'Please enter an ID.';
						return undefined;
					},
				}),
		});
		id = cfg.id;
	}

	const fontDir = path.join(currentDir, id);

	// Check if the directory does not exist
	if (!(await fs.pathExists(`${currentDir}/${id}/files`))) {
		if (ci) {
			throw new Error('The directory does not exist.');
		}
		cancel('The directory does not exist.');
		return;
	}

	// Check if the metadata.json file exists
	if (!(await fs.pathExists(path.join(fontDir, 'metadata.json')))) {
		if (ci) {
			throw new Error('The metadata.json file does not exist.');
		}
		cancel('The metadata.json file does not exist.');
		return;
	}

	// Check if LICENSE file exists
	if (!(await fs.pathExists(path.join(fontDir, 'LICENSE')))) {
		if (ci) {
			throw new Error('The LICENSE file does not exist.');
		}
		cancel('The LICENSE file does not exist.');
		return;
	}

	// Verify filenames
	try {
		// Read metadata.json
		const metadata: Metadata = await fs.readJson(
			path.join(fontDir, 'metadata.json')
		);
		await verifyFilenames(metadata, fontDir);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		if (ci) {
			throw new Error(error.message);
		}
		cancel(error.message);
		return;
	}

	if (ci) {
		consola.success(`${id} passed all checks.`);
	} else {
		outro(
			colors.green(
				'All checks passed! Feel free to send a PR over to the main repo adding the package to the appropriate fonts directory.'
			)
		);
	}
};

export const verifyAll = async (): Promise<void> => {
	const fontDir = './fonts/other';
	const directories = getDirectories(fontDir);
	let hasErrors = false;

	for (const directory of directories) {
		try {
			await verify({ font: directory, ci: true, cwd: fontDir });
		} catch (error) {
			consola.warn(`Error verifying ${directory}.`);
			consola.warn(error);
			hasErrors = true;
		}
	}

	if (hasErrors) {
		consola.error('Errors found. Exiting.');
		process.exit(1);
	}
};
