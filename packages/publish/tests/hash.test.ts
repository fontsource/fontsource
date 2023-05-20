import { describe, expect, it } from 'vitest';
import path from 'pathe';

import { getHash, getAllFiles, hasher } from '../src/hash';

describe('hash functions', () => {
	it('gets all files', async () => {
		const files = await getAllFiles(path.join(__dirname, 'fixtures/package1'));
		expect(files).toEqual([
			expect.stringContaining(
				'fontsource/packages/publish/tests/fixtures/package1/files/test.txt'
			),
		]);
	});

	it('gets hash', async () => {
		const newHasher = await hasher();
		const hash = await getHash(
			path.join(__dirname, 'fixtures/package1'),
			newHasher
		);
		expect(hash).toEqual('2d7f1808da1fa63c');

		const hash2 = await getHash(
			path.join(__dirname, 'fixtures/package2'),
			newHasher
		);
		expect(hash2).toEqual('2d7f1808da1fa63c');

		const hash3 = await getHash(
			path.join(__dirname, 'fixtures/package3diff'),
			newHasher
		);
		expect(hash3).toEqual('d4a613dee558a143');
	});
});
