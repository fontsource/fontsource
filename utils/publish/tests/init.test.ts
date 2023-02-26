import * as fs from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import { init } from '../src/init';

vi.mock('node:fs/promises');

describe('init command', () => {
	it('writes config file', async () => {
		await init();
		expect(vi.mocked(fs.writeFile)).toHaveBeenCalled();
	});
});
