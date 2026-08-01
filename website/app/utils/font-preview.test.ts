import { describe, expect, it } from 'vitest';
import { getFontFamilyStack } from './font-preview';
import type { RegistryFamily } from './registry';

const registry = {
	id: 'example',
	family: 'Example',
	provider: 'fontsource',
	status: 'active',
	classifications: ['sans-serif'],
	tags: [],
	sourceModified: '2026-08-01',
	axes: [],
	languages: [],
	license: {
		id: 'OFL-1.1',
		url: 'https://example.com/license',
		text: 'License text',
	},
	sources: [],
	distribution: {
		static: [],
		characters: { type: 'all' },
	},
} satisfies RegistryFamily;

describe('getFontFamilyStack', () => {
	it('uses the static family when variable metadata is unavailable', () => {
		const metadata = {
			id: 'fraunces',
			family: 'Fraunces',
			variable: true,
		};

		expect(getFontFamilyStack(metadata, false)).toBe(
			'"Fraunces", "Fallback Outline"',
		);
		expect(getFontFamilyStack(metadata, true)).toBe(
			'"Fraunces Variable", "Fallback Outline"',
		);
	});

	it('uses specialist registry tags instead of family IDs', () => {
		const metadata = {
			id: 'unrelated-name',
			family: 'Specialist',
			variable: false,
		};

		expect(
			getFontFamilyStack(metadata, false, {
				...registry,
				tags: ['special-use/punctuation'],
			}),
		).toContain('"Noto Sans JP", sans-serif');
		expect(
			getFontFamilyStack(metadata, false, {
				...registry,
				tags: ['special-use/digital-display'],
			}),
		).toContain('ui-monospace, monospace');
	});
});
