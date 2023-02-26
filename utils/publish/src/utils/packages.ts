import consola from 'consola';
import * as fs from 'node:fs/promises';
import * as path from 'pathe';
import colors from 'picocolors';

import type { PackageJson } from '../types';


const pathToPackage = async (dirArray: string[]): Promise<PackageJson[]> => {
	const packages = [];
	for (const dir of dirArray) {
		const packageJsonPath = path.join(dir, 'package.json');
		try {
			const data = fs.readFile(
				path.join(process.cwd(), packageJsonPath), 'utf8'
			);
			packages.push(data);
		} catch {
			consola.warn(
				colors.red(`${packageJsonPath} may have been removed. Not publishing.`)
			);

		}
	}

	const awaitPackages = await Promise.all(packages);
	return awaitPackages.map(data => JSON.parse(data) as PackageJson);
};

export { pathToPackage };
