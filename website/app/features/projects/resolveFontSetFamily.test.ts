import { describe, expect, it } from 'vitest';

import type {
	ListRegistryFamiliesResponse,
	ResolveFontPackagesResponse,
} from '@/generated/api';

import { resolveFontSetFamily } from './resolveFontSetFamily';

const artifact = {
	id: 'example',
	packageName: '@fontsource-variable/example',
	packageVersion: '5.3.0',
	fontFamily: 'Example Variable',
} satisfies ResolveFontPackagesResponse['items'][number];

const registry = {
	id: 'example',
	family: 'Example',
	provider: 'fontsource',
	status: 'active',
	classifications: ['sans-serif'],
	tags: [],
	sourceModified: '2026-08-01',
	axes: ['wght'],
	license: { id: 'OFL-1.1', url: 'https://example.com/license' },
} satisfies ListRegistryFamiliesResponse[number];

describe('resolveFontSetFamily', () => {
	it('resolves the standard variable package', () => {
		const item = resolveFontSetFamily({ artifact, registry });

		expect(item).toMatchObject({
			familyId: 'example',
			packageName: '@fontsource-variable/example',
			packageVersion: '5.3.0',
			fontFamily: 'Example Variable',
			family: 'Example',
		});
	});

	it('uses the standard static package for a static-only family', () => {
		const item = resolveFontSetFamily({
			artifact: {
				...artifact,
				packageName: '@fontsource/example',
				fontFamily: 'Example',
			},
			registry,
		});

		expect(item).toMatchObject({
			packageName: '@fontsource/example',
			fontFamily: 'Example',
			family: 'Example',
		});
	});

	it('uses registry display, sample, designer, and license data without persisting capabilities', () => {
		const detailedRegistry = {
			...registry,
			family: 'Example Symbols',
			designer: 'Example Studio',
			classifications: ['symbols'],
			tags: ['special-use/icons'],
			status: 'active',
			sampleText: { short: 'home settings' },
			license: {
				id: 'Apache-2.0',
				url: 'https://www.apache.org/licenses/LICENSE-2.0',
			},
		} satisfies ListRegistryFamiliesResponse[number];
		const item = resolveFontSetFamily({
			artifact,
			registry: detailedRegistry,
		});

		expect(item).toMatchObject({
			family: 'Example Symbols',
			classification: 'symbols',
			designer: 'Example Studio',
			previewText: 'home settings',
			license: {
				id: 'Apache-2.0',
				url: 'https://www.apache.org/licenses/LICENSE-2.0',
			},
		});
		expect(item).not.toHaveProperty('axes');
		expect(item).not.toHaveProperty('cssFile');
		expect(item).not.toHaveProperty('symbolInputModes');
	});
});
