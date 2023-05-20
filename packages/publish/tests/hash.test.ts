import { describe, expect, it } from 'vitest';
import path from 'pathe';

import { getHash, getAllFiles } from '../src/hash';

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
		const hash = await getHash(path.join(__dirname, 'fixtures/package1'));
		expect(hash).toEqual('2d7f1808da1fa63c');

		const hash2 = await getHash(path.join(__dirname, 'fixtures/package2'));
		expect(hash2).toEqual('2d7f1808da1fa63c');

		const hash3 = await getHash(path.join(__dirname, 'fixtures/package3diff'));
		expect(hash3).toEqual('d4a613dee558a143');
	});
});
