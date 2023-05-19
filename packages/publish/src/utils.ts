import defu from 'defu';
import fs from 'fs-extra';

import type { Context, Flags } from './types';

const getPackages = async (dir: string): Promise<string[]> => {
	const packages = await fs.readdir(dir, {
		withFileTypes: true,
	});
	return packages
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);
};

const mergeFlags = async (options: Flags): Promise<Context> => {
	const flags = {} as Context;
	// CLI args come in string format
	if (options.packages) flags.packages = options.packages.split(',');

	return defu(flags, await fs.readJson('font-publish.json'));
};

export { getPackages,mergeFlags };
