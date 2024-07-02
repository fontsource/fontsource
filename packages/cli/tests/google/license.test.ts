import fs from 'fs-extra';
import { describe, expect, it, vi } from 'vitest';

import { generateLicense } from '../../src/google/license';

vi.mock('fs-extra');

describe('generate license', () => {
	const fontLicense = {
		id: 'noto-sans-jp',
		authors: { copyright: 'Google Inc.' },
		license: {
			type: 'SIL Open Font License, 1.1',
			url: 'http://scripts.sil.org/OFL',
		},
		original: 'Google Inc.',
	};

	it('should generate license successfully (apache)', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		const license = {
			...fontLicense,
			license: { ...fontLicense.license, type: 'apache license, version 2.0' },
		};

		await generateLicense(license, buildOpts);

		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			expect.anything(),
		);
	});

	it('should generate license successfully (ofl)', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		const license = {
			...fontLicense,
			license: { ...fontLicense.license, type: 'sil open font license, 1.1' },
		};

		await generateLicense(license, buildOpts);

		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			expect.anything(),
		);
	});

	it('should generate license successfully (ufl)', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		const license = {
			...fontLicense,
			license: { ...fontLicense.license, type: 'ubuntu font license, 1.0' },
		};

		await generateLicense(license, buildOpts);

		expect(vi.mocked(fs.writeFile)).toBeCalledWith(
			'test/noto-sans-jp/LICENSE',
			expect.anything(),
		);
	});

	it('should throw error when license type is unknown', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		const license = {
			...fontLicense,
			license: { ...fontLicense.license, type: 'unknown' },
		};

		await expect(generateLicense(license, buildOpts)).rejects.toThrow();
	});
});
