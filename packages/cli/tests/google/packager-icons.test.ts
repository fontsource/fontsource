import fs from 'fs-extra';
import * as gfm from 'google-font-metadata';
import { describe, expect, it, vi } from 'vitest';

import {
	packagerIconsStatic,
	packagerIconsVariable,
} from '../../src/google/packager-icons';
import APIIconStaticMock from './fixtures/icons-static.json';
import APIIconVariableMock from './fixtures/icons-variable.json';

vi.mock('fs-extra');
vi.mock('google-font-metadata');

describe('packager icons', () => {
	vi.spyOn(gfm, 'APIIconStatic', 'get').mockReturnValue(APIIconStaticMock);
	vi.spyOn(gfm, 'APIIconVariable', 'get').mockReturnValue(APIIconVariableMock);

	it('should generate Material Icons CSS successfully (static)', async () => {
		const buildOpts = {
			dir: 'test/material-icons',
			tmpDir: 'test',
			force: false,
			isVariable: false,
			isIcon: true,
		};

		await packagerIconsStatic('material-icons', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});

	it('should generate Material Symbols Sharp CSS successfully (variable)', async () => {
		const buildOpts = {
			dir: 'test/material-symbols-sharp',
			tmpDir: 'test',
			force: false,
			isVariable: true,
			isIcon: true,
		};

		await packagerIconsVariable('material-symbols-sharp', buildOpts);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});
});
