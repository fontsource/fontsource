/* eslint-disable consistent-return */
import { cancel, group, intro, outro,text } from '@clack/prompts';
import fs from 'fs-extra';
import path from 'pathe';
import colors from 'picocolors';

import { Metadata } from '../types';

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
				expectedFilenames.push(`${metadata.id}-${subset}-${weight}-${style}.woff2`, `${metadata.id}-${subset}-${weight}-${style}.woff`);
			}
		}
	}


	// Check if all expected filenames are present and show all missing or non-matching filenames
	const missingFilenames = expectedFilenames.filter((filename) => !filenames.includes(filename));
	if (missingFilenames.length > 0) {
		throw new Error(`The following files are missing: ${missingFilenames.join(', ')}\n\n\tPlease ensure the file names match the format "${metadata.id}-subset-weight-style.extension"\n\tExample: "${metadata.id}-latin-400-normal.woff2" or "${metadata.id}-latin-ext-700-italic.woff"`);
	}

	// Check if all filenames are expected and show all non-matching filenames
	const nonMatchingFilenames = filenames.filter((filename) => !expectedFilenames.includes(filename));
	if (nonMatchingFilenames.length > 0) {
		throw new Error(`The following files are not expected: ${nonMatchingFilenames.join(', ')}\n\n\tPlease ensure the file names match the format "${metadata.id}-subset-weight-style.extension"\n\tExample: "${metadata.id}-latin-400-normal.woff2" or "${metadata.id}-latin-ext-700-italic.woff"`);
	}


};


export const verify = async (): Promise<void> => {
	intro(colors.cyan(colors.bold('fontsource')));
	const cfg = await group({
		id: () => text({
			message: colors.bold('What is the ID of the font?'),
			placeholder: 'noto-sans-jp',
			validate(value) {
				if (!value) return 'Please enter an ID.';
			}
		}),
	});

	// Check if the directory does not exist
	if (!(await fs.pathExists(`./${cfg.id}/files`))) {
		cancel('The directory does not exist.');
		return;

	}

	// Check if the metadata.json file exists
	if (!(await fs.pathExists(`./${cfg.id}/metadata.json`))) {
		cancel('The metadata.json file does not exist.');
		return;
	}

	// Check if LICENSE file exists
	if (!(await fs.pathExists(`./${cfg.id}/LICENSE`))) {
		cancel('The LICENSE file does not exist.');
		return;
	}

	// Verify filenames
	try {
		const dir = `./${cfg.id}`;
		// Read metadata.json
		const metadata: Metadata = await fs.readJson(path.join(dir, 'metadata.json'));
		await verifyFilenames(metadata, dir);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		cancel(error.message);
		return;
	}

	outro(colors.green('All checks passed! Feel free to send a PR over to the main repo adding the package to the appropriate fonts directory.'));
};


