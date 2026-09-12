import { describe, expect, it } from 'vitest';

import { resolveFontSetFamily } from './resolveFontSetFamily';

const artifact = {
	id: 'example',
	packageName: '@fontsource-variable/example',
	packageVersion: '5.3.0',
	fontFamily: 'Example Variable',
};

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
} satisfies Parameters<typeof resolveFontSetFamily>[0]['registry'];

describe('resolveFontSetFamily', () => {
	it('resolves the standard variable package', () => {
		const item = resolveFontSetFamily({ registry, artifact });

		expect(item).toMatchObject({
			familyId: 'example',
			packageName: '@fontsource-variable/example',
			packageVersion: '5.3.0',
			fontFamily: 'Example Variable',
			family: 'Example',
		});
	});

	it('uses the published static package when selected by the API', () => {
		const item = resolveFontSetFamily({
			registry,
			artifact: {
				...artifact,
				packageName: '@fontsource/example',
				packageVersion: '5.2.1',
				fontFamily: 'Example',
			},
		});

		expect(item).toMatchObject({
			packageName: '@fontsource/example',
			packageVersion: '5.2.1',
			fontFamily: 'Example',
			family: 'Example',
		});
	});

	it('does not resolve a family without license metadata', () => {
		expect(
			resolveFontSetFamily({
				artifact,
				registry: { ...registry, license: undefined },
			}),
		).toBeUndefined();
	});

	it('uses registry display, sample, designer, and license data without persisting capabilities', () => {
		const detailedRegistry = {
			...registry,
			family: 'Example Symbols',
			designer: 'Example Studio',
			classifications: ['symbols'],
			sampleText: { short: 'home settings' },
			license: {
				id: 'Apache-2.0',
				url: 'https://www.apache.org/licenses/LICENSE-2.0',
			},
		} satisfies Parameters<typeof resolveFontSetFamily>[0]['registry'];
		const item = resolveFontSetFamily({
			registry: detailedRegistry,
			artifact,
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
