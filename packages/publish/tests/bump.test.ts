import latestVersion from 'latest-version';
import { describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';

import {
	bumpPackages,
	bumpValue,
	isValidBumpArg,
	verifyVersion,
} from '../src/bump';
import { ChangedList } from '../src/types';
import stringify from 'json-stringify-pretty-compact';

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
	it('patch', () => {
		const newVersion = bumpValue('1.0.0', 'patch');
		expect(newVersion).toBe('1.0.1');
	});

	it('minor', () => {
		const newVersion = bumpValue('1.0.0', 'minor');
		expect(newVersion).toBe('1.1.0');

		const newVersion2 = bumpValue('1.1.1', 'minor');
		expect(newVersion2).toBe('1.2.0');
	});

	it('major', () => {
		const newVersion = bumpValue('1.0.0', 'major');
		expect(newVersion).toBe('2.0.0');

		const newVersion2 = bumpValue('1.1.1', 'major');
		expect(newVersion2).toBe('2.0.0');
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

	describe('bumps packages with changelist', async () => {
		const changelist: ChangedList = [
			{
				name: 'package1',
				path: 'packages/publish/tests/fixtures/package1',
				hash: '2d7f1808da1fa63c',
				version: '0.1.0',
			},
			{
				name: 'package3',
				path: 'packages/publish/tests/fixtures/package3diff',
				hash: 'd4a613dee558a143',
				version: '0.3.0',
			},
		];

		const config = {
			packages: ['./packages/publish/tests/fixtures/'],
			ignoreExtension: [],
			commitMessage: 'chore: release new versions',
			noVerify: true,
			yes: true,
		};

		it('bumps package with changelist patch', async () => {
			vi.mocked(fs.readJSON).mockResolvedValueOnce({
				version: '0.1.0',
				publishHash: '2d7f1808da1fa63c',
			});

			vi.mocked(fs.readJSON).mockResolvedValueOnce({
				version: '0.3.0',
				publishHash: 'd4a613dee558a143',
			});

			vi.mocked(latestVersion).mockResolvedValueOnce('0.1.0');
			vi.mocked(latestVersion).mockResolvedValueOnce('0.3.0');

			const bumpObjects = await bumpPackages(changelist, config, 'patch');
			expect(bumpObjects).toEqual([
				{
					name: 'package1',
					path: 'packages/publish/tests/fixtures/package1',
					hash: '2d7f1808da1fa63c',
					version: '0.1.0',
					bumpVersion: '0.1.1',
				},
				{
					name: 'package3',
					path: 'packages/publish/tests/fixtures/package3diff',
					hash: 'd4a613dee558a143',
					version: '0.3.0',
					bumpVersion: '0.3.1',
				},
			]);

			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledTimes(2);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				'packages/publish/tests/fixtures/package1/package.json',
				stringify({
					version: '0.1.1',
					publishHash: '2d7f1808da1fa63c',
				})
			);

			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				'packages/publish/tests/fixtures/package3diff/package.json',
				stringify({
					version: '0.3.1',
					publishHash: 'd4a613dee558a143',
				})
			);
		});

		it('throws with changelist from-package with existing version', async () => {
			vi.mocked(fs.readJSON).mockResolvedValueOnce({
				version: '0.1.0',
				publishHash: '2d7f1808da1fa63c',
			});

			vi.mocked(fs.readJSON).mockResolvedValueOnce({
				version: '0.3.0',
				publishHash: 'd4a613dee558a143',
			});

			vi.mocked(latestVersion).mockResolvedValueOnce('0.1.0');
			vi.mocked(latestVersion).mockResolvedValueOnce('0.3.0');

			const newConfig = { ...config, noVerify: false };
			expect(await bumpPackages(changelist, newConfig, 'from-package')).toEqual(
				[
					{
						name: 'package1',
						path: 'packages/publish/tests/fixtures/package1',
						hash: '2d7f1808da1fa63c',
						noPublish: true,
						version: '0.1.0',
						bumpVersion: '0.1.0',
					},
					{
						name: 'package3',
						path: 'packages/publish/tests/fixtures/package3diff',
						hash: 'd4a613dee558a143',
						noPublish: true,
						version: '0.3.0',
						bumpVersion: '0.3.0',
					},
				]
			);

			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledTimes(0);
		});

		it('bumps package with changelist noVerify from-package', async () => {
			vi.mocked(fs.readJSON).mockResolvedValueOnce({
				version: '0.1.0',
				publishHash: '2d7f1808da1fa63c',
			});

			vi.mocked(fs.readJSON).mockResolvedValueOnce({
				version: '0.3.0',
				publishHash: 'd4a613dee558a143',
			});

			const bumpObjects = await bumpPackages(
				changelist,
				config,
				'from-package'
			);

			expect(bumpObjects).toEqual([
				{
					name: 'package1',
					path: 'packages/publish/tests/fixtures/package1',
					hash: '2d7f1808da1fa63c',
					version: '0.1.0',
					bumpVersion: '0.1.0',
				},
				{
					name: 'package3',
					path: 'packages/publish/tests/fixtures/package3diff',
					hash: 'd4a613dee558a143',
					version: '0.3.0',
					bumpVersion: '0.3.0',
				},
			]);

			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledTimes(2);
			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				'packages/publish/tests/fixtures/package1/package.json',
				stringify({
					version: '0.1.0',
					publishHash: '2d7f1808da1fa63c',
				})
			);

			expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
				'packages/publish/tests/fixtures/package3diff/package.json',
				stringify({
					version: '0.3.0',
					publishHash: 'd4a613dee558a143',
				})
			);
		});
	});
});
