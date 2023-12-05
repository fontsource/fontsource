import { describe, expect, it } from 'vitest';

import { getChanged } from '../src/changed';

describe('get changed packages', () => {
	const config = {
		packages: ['./tests/fixtures/'],
		ignoreExtension: [],
		commitMessage: 'chore: release new versions',
	};
	it('lists all changed packages', async () => {
		const packages = await getChanged(config);
		// Package 1 has no hash, so it should generate a new one
		// Package 2 has a matching existing hash, so it should not generate a new one
		// Package 3 has an existing hash, but differing file contents, so it should generate a new one
		expect(packages).toEqual([
			{
				name: 'package1',
				path: 'packages/publish/tests/fixtures/package1',
				hash: '2d7f1808da1fa63c',
				version: '0.1.0',
			},
			{
				name: 'package3',
				path: 'packages/publish/tests/fixtures/package3diff',
				hash: 'd4a613dee558a143',
				version: '0.3.0',
			},
		]);
	});

	it('lists all packages with force flag', async () => {
		const packages = await getChanged({
			...config,
			force: true,
		});
		expect(packages).toEqual([
			{
				name: 'package1',
				path: '/tests/fixtures/package1',
				hash: '2d7f1808da1fa63c',
				version: '0.1.0',
			},
			{
				name: 'package2',
				path: '/tests/fixtures/package2',
				hash: '2d7f1808da1fa63c',
				version: '0.2.0',
			},
			{
				name: 'package3',
				path: '/tests/fixtures/package3diff',
				hash: 'd4a613dee558a143',
				version: '0.3.0',
			},
		]);
	});
});
