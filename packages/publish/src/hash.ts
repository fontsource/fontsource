import { createXXHash64 } from 'hash-wasm';
import * as fs from 'fs-extra';
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

const getHash = async (dir: string): Promise<string> => {
	const files = await getAllFiles(dir);
	const hash = await createXXHash64();
	for (const file of files) {
		const contents = await fs.readFile(file);
		hash.update(contents);
	}
	return hash.digest();
};

export { getHash, getAllFiles };
