/* eslint-disable no-await-in-loop */
import { consola } from 'consola';
import fs from 'fs-extra';
import path from 'pathe';

import { type Metadata } from '../types';
import { buildCustom } from './build';
import { getDirectories } from './utils';
import { verifyAll } from './verify';

const getMetadata = async (dir: string): Promise<Metadata> => {
	return await fs.readJson(path.join(dir, 'metadata.json'), 'utf8');
};

interface PackageJson {
	version: string;
	publishHash?: string;
}

const getPackageJson = async (dir: string): Promise<PackageJson> => {
	return await fs.readJson(path.join(dir, 'package.json'), 'utf8');
};

interface RebuildOptions {
	cwd?: string;
}

// Run rebuild
export const rebuild = async (opts?: RebuildOptions) => {
	const dir = './fonts/other';
	const directories = getDirectories(dir, opts?.cwd);

	for (const directory of directories) {
		const fontDir = path.join(opts?.cwd ?? process.cwd(), dir, directory);
		const metadata = await getMetadata(fontDir);
		const pkgJson = await getPackageJson(fontDir);

		// Delete everything in dir except files
		const files = await fs.readdir(fontDir);
		for (const file of files) {
			if (file !== 'files' && file !== 'LICENSE') {
				await fs.remove(path.join(fontDir, file));
			}
		}

		await buildCustom(metadata, {
			dir,
			version: pkgJson.version,
			publishHash: pkgJson.publishHash,
		});

		consola.info(`Rebuilt ${metadata.id}.`);
	}

	await verifyAll();
};
