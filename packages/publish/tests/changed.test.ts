import { describe, expect, it } from 'vitest';

import { getChanged } from '../src/changed';

describe('get changed packages', () => {
	const config = {
		packages: ['./tests/fixtures/'],
		ignoreExtension: [],
		commitMessage: 'chore: release new versions',
	};
	it('lists all the packages', async () => {
		const packages = await getChanged(config);
		// Package 1 has no hash, so it should generate a new one
		// Package 2 has a matching existing hash, so it should not generate a new one
		// Package 3 has an existing hash, but differing file contents, so it should generate a new one
		expect(packages).toEqual([
			{
				name: 'package1',
				path: 'tests/fixtures/package1',
				hash: 'LLavxt/iSTPxM20Kt5HiX29qAlQ=',
				version: '0.1.0',
			},
			{
				name: 'package3',
				path: 'tests/fixtures/package3diff',
				hash: 'vf/Trotp49mYw0FcaPvFqUqPnOg=',
				version: '0.3.0',
			},
		]);
	});
});
