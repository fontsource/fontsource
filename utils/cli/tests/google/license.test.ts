import fs from 'fs-extra';
import got, { Request } from 'got';
import { describe, expect, it, vi } from 'vitest';

import { generateLicense } from '../../src/google/license';

vi.mock('fs-extra');
vi.mock('got');

describe('generate license', () => {
	it('should generate license successfully (apache)', async () => {
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

		expect(vi.mocked(got.get)).toHaveBeenCalledWith(
			'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/notosansjp/LICENSE.txt'
		);
		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			'test'
		);
	});

	it('should generate license successfully (ofl)', async () => {
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
			'sil open font license, 1.1',
			buildOpts
		);

		expect(vi.mocked(got.get)).toHaveBeenCalledWith(
			'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosansjp/OFL.txt'
		);
		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			'test'
		);
	});

	it('should generate license successfully (ufl)', async () => {
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
			'ubuntu font license, 1.0',
			buildOpts
		);

		expect(vi.mocked(got.get)).toHaveBeenCalledWith(
			'https://cdn.jsdelivr.net/gh/google/fonts@main/ufl/notosansjp/UFL.txt'
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

	it('should throw error when got fails to fetch the license', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		vi.spyOn(got, 'get').mockRejectedValue(new Error('test'));

		await expect(
			generateLicense('noto-sans-jp', 'sil open font license, 1.1', buildOpts)
		).rejects.toThrow();
	});
});
