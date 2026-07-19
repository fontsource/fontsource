import { hash } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export const compareStrings = (left: string, right: string): number =>
	left < right ? -1 : left > right ? 1 : 0;

const sortJsonKeys = (value: unknown): unknown => {
	if (Array.isArray(value)) return value.map(sortJsonKeys);
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([, entry]) => entry !== undefined)
				.toSorted(([left], [right]) => compareStrings(left, right))
				.map(([key, entry]) => [key, sortJsonKeys(entry)]),
		);
	}
	return value;
};

export const canonicalJson = (value: unknown): string =>
	`${JSON.stringify(sortJsonKeys(value), null, '\t')}\n`;

export const sha256 = (value: string | Uint8Array): string =>
	hash('sha256', value);

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
		await access(path);
		return true;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
		throw error;
	}
};
