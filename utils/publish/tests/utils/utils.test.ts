import * as fs from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import type { Config } from '../../src/types';
import { readConfig, updateConfig } from '../../src/utils/utils';

vi.mock('node:fs/promises');

describe('utils', () => {
	it('reads config file', async () => {
		vi.mocked(fs.readFile).mockResolvedValue('{ "commitFrom": "TEST" }');
		const config = await readConfig();
		expect(config.commitFrom).toBe('TEST');
	});

	it('updates config with new head commit', async () => {
		const config: Config = {
			packages: ['packages/*'],
			ignoreExtension: [],
			commitFrom: 'abc',
			commitMessage: 'chore: release new versions',
		};

		await updateConfig(config);
		const call = vi.mocked(fs.writeFile).mock.lastCall as [string, string];
		expect(JSON.parse(call[1]).commitFrom.length).toEqual(40);
	});
});
