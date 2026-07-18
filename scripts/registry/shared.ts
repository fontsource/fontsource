import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const compareStrings = (left: string, right: string): number =>
	left < right ? -1 : left > right ? 1 : 0;

const sortJson = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(sortJson);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, entry]) => entry !== undefined)
				.sort(([left], [right]) => compareStrings(left, right))
				.map(([key, entry]) => [key, sortJson(entry)]),
		);
	}
	return value;
};

export const canonicalJson = (value: unknown): string =>
	`${JSON.stringify(sortJson(value), null, '\t')}\n`;

export const sha256 = (value: string | Uint8Array): string =>
	createHash('sha256').update(value).digest('hex');

export const readJson = async (path: string): Promise<unknown> =>
	JSON.parse(await readFile(path, 'utf8'));

export const readJsonIfExists = async (
	path: string,
): Promise<unknown | null> => {
	try {
		return await readJson(path);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
		throw error;
	}
};

export const writeJson = async (
	path: string,
	value: unknown,
): Promise<void> => {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, canonicalJson(value));
};

export const normalizeText = (value: string): string =>
	`${value.replaceAll('\r\n', '\n').trimEnd()}\n`;

export const pathExists = async (path: string): Promise<boolean> => {
	try {
		await stat(path);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};

export const isMain = (url: string): boolean =>
	process.argv[1] !== undefined &&
	resolve(process.argv[1]) === resolve(fileURLToPath(url));
