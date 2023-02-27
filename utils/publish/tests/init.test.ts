import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import { describe, expect, it, vi } from 'vitest';

import { init } from '../src/init';

vi.mock('fs-extra');

describe('init command', () => {
	it('writes config file', async () => {
		await init();
		expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
			expect.anything(),
			stringify({
				packages: ['./packages/'],
				commitMessage: 'chore: release new versions',
			})
		);
	});
});
