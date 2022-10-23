import fs from 'fs-extra';
import * as gfm from 'google-font-metadata';
import { describe, expect, it, vi } from 'vitest';

import { packagerV2 } from '../../src/google/packager-v2';
import APIv2Mock from './fixtures/google-fonts-v2.json';

vi.mock('fs-extra');
vi.mock('google-font-metadata');

describe('packager v2', () => {
	vi.spyOn(gfm, 'APIv2', 'get').mockReturnValue(APIv2Mock);

	it('should generate Abel CSS successfully', async () => {
		const buildOpts = {
			dir: 'test/abel',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		await packagerV2('abel', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});

	it('should generate Cabin CSS successfully', async () => {
		const buildOpts = {
			dir: 'test/cabin',
			tmpDir: 'test',
			force: false,
			isVariable: true,
		};

		await packagerV2('cabin', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});

	it('should generate Noto Sans JP successfully', async () => {
		const buildOpts = {
			dir: 'test/noto-sans-jp',
			tmpDir: 'test',
			force: false,
			isVariable: false,
		};

		await packagerV2('noto-sans-jp', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});
});
