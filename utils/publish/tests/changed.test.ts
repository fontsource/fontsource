import { describe, expect, it } from 'vitest';

import { getChanged } from '../src/changed';
import { exampleConfig1 } from './helpers/example-configs';

describe('get changed packages', () => {
	it('lists all the packages', async () => {
		const packages = await getChanged(exampleConfig1);
		// Package 1 has no hash, so it should generate a new one
		// Package 2 has a matching existing hash, so it should not generate a new one
		// Package 3 has an existing hash, but differing file contents, so it should generate a new one
		expect(packages).toEqual({
			package1: {
				name: 'package1',
				path: 'tests/fixtures/package1',
				hash: 'LLavxt/iSTPxM20Kt5HiX29qAlQ=',
			},
			package3diff: {
				name: 'package3',
				path: 'tests/fixtures/package3diff',
				hash: 'vf/Trotp49mYw0FcaPvFqUqPnOg=',
			},
		});
	});
});
