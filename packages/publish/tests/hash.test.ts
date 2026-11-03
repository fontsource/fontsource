import { mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'pathe';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { getAllFiles, getHash } from '../src/hash';

let directory: string;
beforeEach(async () => {
	directory = await mkdtemp(path.join(tmpdir(), 'publish-hash-'));
	await writeFile(
		path.join(directory, 'package.json'),
		JSON.stringify({ name: 'font-test', version: '1.0.0', files: ['*.woff2'] }),
	);
	await writeFile(path.join(directory, 'font.woff2'), 'font bytes');
});
afterEach(() => rm(directory, { recursive: true, force: true }));

it('hashes npm deliverables, including binary contents and filenames', async () => {
	const original = await getHash(directory);
	await writeFile(path.join(directory, 'font.woff2'), 'different font bytes');
	expect(await getHash(directory)).not.toBe(original);
	await writeFile(path.join(directory, 'font.woff2'), 'font bytes');
	await rename(
		path.join(directory, 'font.woff2'),
		path.join(directory, 'renamed.woff2'),
	);
	expect(await getHash(directory)).not.toBe(original);
});

it('ignores release bookkeeping and unpublished files but includes package metadata', async () => {
	const original = await getHash(directory);
	await writeFile(path.join(directory, 'ignored.txt'), 'not published');
	await writeFile(path.join(directory, '.npmrc'), 'private config');
	const metadata = {
		name: 'font-test',
		version: '2.0.0',
		files: ['*.woff2'],
		publishHash: 'old',
	};
	await writeFile(
		path.join(directory, 'package.json'),
		JSON.stringify(metadata, null, 2),
	);
	expect(await getHash(directory)).toBe(original);
	expect(
		(await getAllFiles(directory)).map((file) => path.basename(file)),
	).toEqual(['font.woff2', 'package.json']);
	await writeFile(
		path.join(directory, 'package.json'),
		JSON.stringify({ ...metadata, exports: './font.woff2' }),
	);
	expect(await getHash(directory)).not.toBe(original);
});
