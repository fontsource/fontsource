import { describe, expect, it } from 'vitest';
import type { GetFontResponse } from '@/generated/api';
import {
	getFontFamilyStack,
	getPreferredPreviewSubset,
	getRegistrySourcePreviewCSS,
} from './font-preview';
import type { RegistryFamily, RegistrySource } from './registry';

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
	previewSource: 'source',
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

describe('getPreferredPreviewSubset', () => {
	const metadata = {
		defSubset: 'latin',
		subsets: ['japanese', 'latin'],
	} as GetFontResponse;

	it('uses a distributed registry preview subset', () => {
		expect(
			getPreferredPreviewSubset(metadata, {
				...registry,
				previewSubset: 'japanese',
			}),
		).toBe('japanese');
	});

	it('falls back to the package default when no reviewed subset is available', () => {
		expect(getPreferredPreviewSubset(metadata, registry)).toBe('latin');
	});
});

describe('getRegistrySourcePreviewCSS', () => {
	it('loads the exact static Registry source', () => {
		const source = {
			sha256: 'static-400',
			filename: 'example.ttf',
			format: 'ttf',
			size: 1,
			downloadUrl: '/v1/registry/sources/static-400',
			capabilitiesUrl: '/v1/registry/sources/static-400/capabilities',
			fontVersion: null,
			style: 'normal',
			type: 'static',
			weight: 400,
		} satisfies RegistrySource;

		expect(getRegistrySourcePreviewCSS(source)).toContain(
			'src: url("https://api.fontsource.org/v1/registry/sources/static-400") format("truetype");',
		);
		expect(getRegistrySourcePreviewCSS(source)).toContain('font-weight: 400;');
	});

	it('preserves a variable source weight range', () => {
		const source = {
			sha256: 'variable-standard',
			filename: 'example.otf',
			format: 'otf',
			size: 1,
			downloadUrl: '/v1/registry/sources/variable-standard',
			capabilitiesUrl: '/v1/registry/sources/variable-standard/capabilities',
			fontVersion: null,
			style: 'italic',
			type: 'variable',
			weight: { min: 100, max: 900, default: 450 },
			axes: [{ tag: 'wght', min: 100, max: 900, default: 450 }],
		} satisfies RegistrySource;

		const css = getRegistrySourcePreviewCSS(source);
		expect(css).toContain('format("opentype")');
		expect(css).toContain('font-style: italic;');
		expect(css).toContain('font-weight: 100 900;');
	});
});
