import { fileURLToPath } from 'node:url';

import path from 'pathe';
import { describe, expect, it } from 'vitest';

import { getAllFiles, getHash } from '../src/hash';

describe('hash functions', () => {
	it('gets all files', async () => {
		const files = await getAllFiles(
			path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'fixtures/package1'
			)
		);
		expect(files).toEqual([
			expect.stringContaining(
				'fontsource/packages/publish/tests/fixtures/package1/files/test.txt'
			),
		]);
	});

	it('gets hash', async () => {
		const hash = await getHash(
			path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'fixtures/package1'
			)
		);
		expect(hash).toEqual('2d7f1808da1fa63c');

		const hash2 = await getHash(
			path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'fixtures/package2'
			)
		);
		expect(hash2).toEqual('2d7f1808da1fa63c');

		const hash3 = await getHash(
			path.join(
				path.dirname(fileURLToPath(import.meta.url)),
				'fixtures/package3diff'
			)
		);
		expect(hash3).toEqual('d4a613dee558a143');
	});
});
