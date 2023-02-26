/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import path from 'pathe';

/**
 * Google may sometimes push a new font that already exists in the custom folder
 * This checks if there are any duplicates between the two font folders and purges the duplicate from generic
 */

const getDirectories = (type: string) =>
	fs
		.readdirSync(`./fonts/${type}`, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

// Check if package exists in a non-google directory and deletes it
const checkDirectory = async (dirPath: string): Promise<any> => {
	try {
		await fs.access(dirPath);
		const packageJson = await fs.readJson(path.join(dirPath, 'package.json'));
		await fs.rm(dirPath, { recursive: true });
		return packageJson;
	} catch {
		return undefined;
	}
};

export const purgeDuplicates = async () => {
	const directories = [
		...getDirectories('google'),
		...getDirectories('league'),
		...getDirectories('icons'),
		...getDirectories('other'),
	];

	// Return an array of duplicate packages found
	const duplicates = directories.filter(
		(item, index) => directories.indexOf(item) !== index
	);

	// Delete packages from league, icons and other directory
	for (const dir of duplicates) {
		for (const type of ['league', 'icons', 'other']) {
			const dirPath = path.join('fonts', type, dir);
			const packageJson = await checkDirectory(dirPath);

			// If package.json exists, update version number in the Google dir
			// This is to prevent publish errors as the newly formed Google package
			// will have an older version number
			if (packageJson) {
				const packageJsonGoogle = await fs.readJson(
					path.join('fonts', 'google', dir, 'package.json')
				);
				packageJsonGoogle.version = packageJson.version;
				await fs.writeFile(
					path.join('fonts', 'google', dir, 'package.json'),
					stringify(packageJsonGoogle)
				);
			}
		}
	}
};

/**
	* When changes are made to the packages without Google pushing an update, the
	* packages will not have any font files to publish due to font files not being
	* committed to the repository.
	*
	* This aims to detect packages about to be published and download their relevant
	* font files to be published again.
*/


/**
	* Google may deprecate a font removing it from Google Font Metadata datasets.
	* This causes a fail in downloading font files as the URLs are unknown, which
	* leads to a "change" detected by the publisher leading to a ghost package with
	* no font files to be published.
	*
	* This should handle deprecrations gracefully and move deprecated fonts into the
	* other directory. Font files should be redownloaded and committed.
*/
