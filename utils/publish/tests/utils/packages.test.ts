import * as fs from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';

import { pathToPackage } from '../../src/utils/packages';

vi.mock('node:fs/promises');

describe('should get package jsons', () => {
	it('should read successfully', async () => {
		vi.mocked(fs.readFile).mockResolvedValue('{ "name": "Test Package" }');
		const names = await pathToPackage(['test']);
		expect(names[0]).toEqual({ name: 'Test Package' });
	});
});
