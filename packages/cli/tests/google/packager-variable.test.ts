import fs from 'fs-extra';
import * as gfm from 'google-font-metadata';
import { describe, expect, it, vi } from 'vitest';

import { packagerVariable } from '../../src/google/packager-variable';
import APIv2Mock from './fixtures/google-fonts-v2.json';
import APIVariableMock from './fixtures/variable.json';

vi.mock('fs-extra');
vi.mock('google-font-metadata');

describe('packager variable', () => {
	vi.spyOn(gfm, 'APIv2', 'get').mockReturnValue(APIv2Mock);
	vi.spyOn(gfm, 'APIVariable', 'get').mockReturnValue(APIVariableMock);

	it('should generate standard variable font successfully (cabin)', async () => {
		const buildOpts = {
			dir: 'test/cabin',
			tmpDir: 'tempDir',
			force: false,
			isVariable: true,
		};

		await packagerVariable('cabin', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});

	it('should generate variable font without wght successfully (ballet)', async () => {
		const buildOpts = {
			dir: 'test/ballet',
			tmpDir: 'tempDir',
			force: false,
			isVariable: true,
		};

		await packagerVariable('ballet', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});

	it('should generate variable font with lots of axes (roboto-flex)', async () => {
		const buildOpts = {
			dir: 'test/roboto-flex',
			tmpDir: 'tempDir',
			force: false,
			isVariable: true,
		};

		await packagerVariable('roboto-flex', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});
});
