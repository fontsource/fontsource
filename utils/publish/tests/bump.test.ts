import latestVersion from 'latest-version';
import { describe, expect, it, vi } from 'vitest';

import { bumpValue, isValidBumpArg, verifyVersion } from '../src/bump';

vi.mock('fs-extra');
vi.mock('latest-version');

describe('is valid bump arg', () => {
	it('checks valid args', async () => {
		const validArgs = ['patch', 'minor', 'major', 'from-package', '1.0.0'];
		for (const arg of validArgs) {
			expect(isValidBumpArg(arg)).toBe(true);
		}
	});

	it('checks invalid args', async () => {
		const invalidArgs = ['invalid', 'a.b.c', '1.1.1.1'];
		for (const arg of invalidArgs) {
			expect(isValidBumpArg(arg)).toBe(false);
		}
	});
});

describe('bump values', () => {
	it('oatch', () => {
		const newVersion = bumpValue('1.0.0', 'patch');
		expect(newVersion).toBe('1.0.1');
	});

	it('minor', () => {
		const newVersion = bumpValue('1.0.0', 'minor');
		expect(newVersion).toBe('1.1.0');
	});

	it('major', () => {
		const newVersion = bumpValue('1.0.0', 'major');
		expect(newVersion).toBe('2.0.0');
	});

	it('version number', () => {
		const newVersion = bumpValue('1.0.0', '2.5.1');
		expect(newVersion).toBe('2.5.1');
	});

	it('from package', () => {
		const newVersion = bumpValue('2.0.0', 'from-package');
		expect(newVersion).toBe('2.0.0');
	});

	it('false input version', () => {
		const newVersion = bumpValue('a.b.c', 'major');
		expect(newVersion).toBeFalsy();
	});

	it('false bump arg', () => {
		const newVersion = bumpValue('1.0.0', 'test');
		expect(newVersion).toBeFalsy();
	});
});

describe('verify version', () => {
	it('successfully passes verification', async () => {
		vi.mocked(latestVersion).mockResolvedValueOnce('1.0.0');
		const bump = await verifyVersion(
			{
				name: 'test',
				version: '1.0.0',
				bumpVersion: '1.0.1',
				path: 'test',
				hash: 'test',
			},
			'patch'
		);
		expect(bump).toEqual({
			name: 'test',
			version: '1.0.0',
			bumpVersion: '1.0.1',
			path: 'test',
			hash: 'test',
		});
	});

	it('revert bump to base as package does not exist', async () => {
		vi.mocked(latestVersion).mockRejectedValueOnce({
			name: 'PackageNotFoundError',
		});
		const bump = await verifyVersion(
			{
				name: 'test',
				version: '1.0.0',
				bumpVersion: '1.0.1',
				path: 'test',
				hash: 'test',
			},
			'patch'
		);
		expect(bump).toEqual({
			name: 'test',
			version: '1.0.0',
			bumpVersion: '1.0.0',
			path: 'test',
			hash: 'test',
		});
	});

	it('throws error as version is less than latest', async () => {
		vi.mocked(latestVersion).mockResolvedValueOnce('1.0.1');
		await expect(
			verifyVersion(
				{
					name: 'test',
					version: '1.0.0',
					bumpVersion: '1.0.1',
					path: 'test',
					hash: 'test',
				},
				'patch'
			)
		).rejects.toThrow('test version mismatch');
	});

	it('applies no publish as version is less than latest and from-package is used', async () => {
		vi.mocked(latestVersion).mockResolvedValueOnce('1.0.1');
		const bump = await verifyVersion(
			{
				name: 'test',
				version: '1.0.0',
				bumpVersion: '1.0.1',
				path: 'test',
				hash: 'test',
			},
			'from-package'
		);
		expect(bump).toEqual({
			name: 'test',
			version: '1.0.0',
			bumpVersion: '1.0.1',
			noPublish: true,
			path: 'test',
			hash: 'test',
		});
	});
});
