import { createXXHash64 } from 'hash-wasm';
import fs from 'fs-extra';
import * as path from 'pathe';

const getAllFiles = async (dir: string): Promise<string[]> => {
	const dirents = await fs.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		dirents.map((dirent) => {
			// If file is package.json, do not include
			if (dirent.name === 'package.json') {
				return [];
			}
			const res = path.resolve(dir, dirent.name);
			return dirent.isDirectory() ? getAllFiles(res) : res;
		})
	);
	return Array.prototype.concat(...files);
};

const hasher = createXXHash64;

const getHash = async (
	dir: string,
	hasher: Awaited<ReturnType<typeof createXXHash64>>
): Promise<string> => {
	const files = await getAllFiles(dir);
	hasher.init();
	for (const file of files) {
		const contents = await fs.readFile(file);
		hasher.update(contents);
	}
	return hasher.digest();
};

export { getHash, getAllFiles, hasher };
