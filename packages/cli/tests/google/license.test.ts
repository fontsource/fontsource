import fs from 'fs-extra';
import { describe, expect, it, vi } from 'vitest';

import { generateLicense } from '../../src/google/license';

vi.mock('fs-extra');

describe('generate license', () => {
	it('should generate license successfully (apache)', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		await generateLicense(
			'noto-sans-jp',
			'apache license, version 2.0',
			buildOpts
		);

		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			expect.anything()
		);
	});

	it('should generate license successfully (ofl)', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		await generateLicense(
			'noto-sans-jp',
			'sil open font license, 1.1',
			buildOpts
		);

		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			expect.anything()
		);
	});

	it('should generate license successfully (ufl)', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		await generateLicense(
			'noto-sans-jp',
			'ubuntu font license, 1.0',
			buildOpts
		);

		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			expect.anything()
		);
	});

	it('should throw error when license type is unknown', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		await expect(
			generateLicense('noto-sans-jp', 'unknown license', buildOpts)
		).rejects.toThrow();
	});
});
