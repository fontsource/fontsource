import fs from 'node:fs';
import path from 'pathe';

export const getDirectories = (dir: string, cwd?: string) => {
	try {
		return fs
			.readdirSync(path.join(cwd ?? process.cwd(), dir), {
				withFileTypes: true,
			})
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);
	} catch {
		return [];
	}
};
