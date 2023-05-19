import fs from 'fs-extra';
import * as gfm from 'google-font-metadata';
import { describe, expect, it, vi } from 'vitest';

import { packagerV1 } from '../../src/google/packager-v1';
import APIv1Mock from './fixtures/google-fonts-v1.json';

vi.mock('fs-extra');
vi.mock('google-font-metadata');

describe('packager v1', () => {
	vi.spyOn(gfm, 'APIv1', 'get').mockReturnValue(APIv1Mock);

	it('should generate Abel CSS successfully', async () => {
		const buildOpts = {
			dir: 'test/abel',
			tmpDir: 'temptest',
			force: false,
			isVariable: false,
		};

		await packagerV1('abel', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});

	it('should generate Noto Sans JP successfully', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'temptest',
			force: false,
			isVariable: false,
		};

		await packagerV1('noto-sans-jp', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});

	it('should generate Cabin CSS successfully', async () => {
		const buildOpts = {
			dir: 'test/cabin',
			tmpDir: 'temptest',
			force: false,
			isVariable: true,
		};

		await packagerV1('cabin', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});
});
