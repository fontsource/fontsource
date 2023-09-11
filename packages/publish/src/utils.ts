import defu from 'defu';
import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import path from 'pathe';

import type { BumpObject, Context, Flags, PackageJson } from './types';

interface WriteOptions {
	version?: boolean;
	hash?: boolean;
}

export const writeUpdate = async (
	pkg: BumpObject,
	opts: WriteOptions,
): Promise<void> => {
	const pkgPath = path.join(pkg.path, 'package.json');
	const pkgJson: PackageJson = await fs.readJson(pkgPath);
	if (opts.version) pkgJson.version = pkg.bumpVersion;
	if (opts.hash) pkgJson.publishHash = pkg.hash;
	await fs.writeFile(pkgPath, stringify(pkgJson));
};

const getPackages = async (dir: string): Promise<string[]> => {
	const packages = await fs.readdir(dir, {
		withFileTypes: true,
	});
	return packages
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);
};

const mergeFlags = async (options: Flags): Promise<Context> => {
	const flags: any = {};
	// CLI args come in string format
	if (options.packages) {
		flags.packages = options.packages.split(',');
		delete options.packages;
	}

	Object.assign(flags, options);

	return defu(flags, await fs.readJson('font-publish.json'));
};

export { getPackages, mergeFlags };
