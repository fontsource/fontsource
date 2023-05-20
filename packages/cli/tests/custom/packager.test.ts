import fs from 'fs-extra';
import { describe, expect, it, vi } from 'vitest';

import { packagerCustom } from '../../src/custom/packager';
import { Metadata } from '../../src/types';

vi.mock('fs-extra');

describe('packager custom', () => {
	it('should generate custom CSS successfully', async () => {
		const metadata: Metadata = {
			id: 'custom-font',
			family: 'Custom Font',
			variable: false,
			weights: [400,500],
			styles: ['normal', 'italic'],
			defSubset: 'latin',
			subsets: ['latin', 'latin-ext'],
			lastModified: '2021-01-01',
			version: '1.0.0',
			category: 'display',
			license: {
				type: 'OFL',
				url: 'license-url',
				attribution: 'Custom Font Author',
			},
			source: 'source-url',
			type: 'other',
		};

		await packagerCustom(metadata);
		expect(vi.mocked(fs.writeFile)).toMatchSnapshot();
	});
});
