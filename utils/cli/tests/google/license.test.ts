import fs from 'fs-extra';
import got, { Request } from 'got';
import { describe, expect, it, vi } from 'vitest';

import { generateLicense } from '../../src/google/license';

vi.mock('fs-extra');
vi.mock('got');

describe('generate license', () => {
	it('should generate license successfully', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		vi.spyOn(got, 'get').mockReturnValue({
			body: 'test',
		} as unknown as Request);

		await generateLicense(
			'noto-sans-jp',
			'apache license, version 2.0',
			buildOpts
		);
		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			'test'
		);
	});

	it('should throw error when license type is unknown', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		vi.spyOn(got, 'get').mockReturnValue({
			body: 'test',
		} as unknown as Request);

		await expect(
			generateLicense('noto-sans-jp', 'unknown license', buildOpts)
		).rejects.toThrow();
	});
});
