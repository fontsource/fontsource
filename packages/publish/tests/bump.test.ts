import fs from 'fs-extra';
import { describe, expect, it, vi } from 'vitest';

import { bumpPackages, bumpValue, isValidBumpArg } from '../src/bump';
import { type ChangedList } from '../src/types';

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

	it('bumps package with changelist patch', async () => {
		vi.mocked(fs.readJSON).mockResolvedValueOnce({
			version: '0.1.0',
			publishHash: '2d7f1808da1fa63c',
		});

		vi.mocked(fs.readJSON).mockResolvedValueOnce({
			version: '0.3.0',
			publishHash: 'd4a613dee558a143',
		});

		const bumpObjects = await bumpPackages(changelist, 'patch');
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

		expect(await bumpPackages(changelist, 'from-package')).toEqual([
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

		const bumpObjects = await bumpPackages(changelist, 'from-package');

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
	});
});
