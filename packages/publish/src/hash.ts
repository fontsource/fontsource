import { createHash } from 'node:crypto';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'pathe';

// Let npm own files/.npmignore semantics, including its mandatory exclusions.
export const getAllFiles = async (dir: string): Promise<string[]> => {
	const { stdout } = await execa(
		'npm',
		['pack', '--dry-run', '--json', '--ignore-scripts'],
		{ cwd: dir },
	);
	const [pack] = Object.values(JSON.parse(stdout)) as [
		{ files: { path: string }[] },
	];
	return pack.files.map((file) => path.resolve(dir, file.path)).sort();
};

export const getHash = async (dir: string): Promise<string> => {
	const hasher = createHash('sha256');
	for (const file of await getAllFiles(dir)) {
		const relative = path.relative(path.resolve(dir), file);
		let contents = await fs.readFile(file);
		if (relative === 'package.json') {
			const {
				version: _version,
				publishHash: _hash,
				...metadata
			} = JSON.parse(contents.toString());
			contents = Buffer.from(JSON.stringify(metadata));
		}
		// Include boundaries and paths: renames and split/concatenated files change the package.
		hasher.update(
			`${Buffer.byteLength(relative)}:${relative}:${contents.length}:`,
		);
		hasher.update(contents);
	}
	return hasher.digest('hex');
};
