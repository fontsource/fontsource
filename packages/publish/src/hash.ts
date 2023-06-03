import fs from 'fs-extra';
import { createXXHash64 } from 'hash-wasm';
import * as path from 'pathe';

const getAllFiles = async (dir: string): Promise<string[]> => {
	const dirents = await fs.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		dirents.map(async (dirent) => {
			// If file is package.json, do not include
			if (dirent.name === 'package.json') {
				return [];
			}
			// Ignore .woff and .woff2 files
			if (dirent.name.endsWith('.woff') || dirent.name.endsWith('.woff2')) {
				return [];
			}
			const res = path.resolve(dir, dirent.name);
			return dirent.isDirectory() ? await getAllFiles(res) : res;
		})
	);
	// eslint-disable-next-line unicorn/prefer-spread
	return Array.prototype.concat(...files);
};

const getHash = async (dir: string): Promise<string> => {
	const files = await getAllFiles(dir);
	const hasher = await createXXHash64();
	hasher.init();
	for (const file of files) {
		const contents = await fs.readFile(file);
		hasher.update(contents);
	}
	return hasher.digest();
};

export { getAllFiles, getHash };
