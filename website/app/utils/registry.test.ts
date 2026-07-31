import { describe, expect, it } from 'vitest';

import type {
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
} from '@/generated/api';

import {
	findUnmappedCharacters,
	getRegistryCharacterGroups,
	isDigitalFontFamily,
	isIconFontFamily,
	isPunctuationFontFamily,
	selectRegistryFamilyLanguages,
	selectRegistrySource,
} from './registry';

const source = (sha256: string, type: 'static' | 'variable', weight: number) =>
	({
		sha256,
		filename: `${sha256}.ttf`,
		format: 'ttf',
		size: 1,
		downloadUrl: `/sources/${sha256}`,
		capabilitiesUrl: `/sources/${sha256}/capabilities`,
		fontVersion: null,
		style: 'normal',
		type,
		weight,
		...(type === 'variable'
			? { axes: [{ tag: 'wght', min: 100, max: 900, default: 400 }] }
			: {}),
	}) as GetRegistryFamilyResponse['sources'][number];

const family = {
	id: 'example',
	family: 'Example',
	provider: 'fontsource',
	status: 'active',
	classifications: ['sans-serif'],
	tags: [],
	sourceModified: '2026-07-31',
	axes: ['wght'],
	languages: [],
	license: { id: 'OFL-1.1', url: 'https://example.com/license' },
	sources: [
		source('static-400', 'static', 400),
		source('variable-standard', 'variable', 400),
	],
	distribution: {
		static: [{ weight: 400, style: 'normal', source: 'static-400' }],
		variable: [
			{
				axisKey: 'standard',
				style: 'normal',
				source: 'variable-standard',
			},
		],
		characters: { type: 'all' },
	},
} satisfies GetRegistryFamilyResponse;

const capabilities = {
	glyphCount: 6,
	codepointCount: 6,
	unicodeRange: 'U+0021, U+0031, U+0041, U+0061, U+00A9, U+0301',
	features: { gsub: ['liga'], gpos: ['kern'] },
	outline: 'glyf',
	colorTables: [],
} satisfies GetRegistrySourceCapabilitiesResponse;

describe('selectRegistrySource', () => {
	it('prefers the normal standard variable distribution source', () => {
		expect(selectRegistrySource(family)?.sha256).toBe('variable-standard');
	});

	it('falls back to the normal regular static source', () => {
		const staticFamily = {
			...family,
			distribution: {
				static: [
					{ weight: 400, style: 'normal' as const, source: 'static-400' },
				],
				characters: { type: 'all' as const },
			},
		};
		expect(selectRegistrySource(staticFamily)?.sha256).toBe('static-400');
	});
});

describe('registry character capabilities', () => {
	it('groups exact mapped characters without invisible codepoints', () => {
		expect(getRegistryCharacterGroups(capabilities)).toEqual({
			groups: {
				all: ['!', '1', 'A', 'a', '©', '́'],
				letters: ['A', 'a', '́'],
				numbers: ['1'],
				punctuation: ['!'],
				symbols: ['©'],
			},
			truncated: false,
		});
	});

	it('reports unique visible characters without a cmap entry', () => {
		expect(findUnmappedCharacters('A B? B', capabilities)).toEqual(['B', '?']);
	});

	it('bounds browsing work for fonts that map most of Unicode', () => {
		const catalog = getRegistryCharacterGroups({
			...capabilities,
			glyphCount: 1_111_998,
			codepointCount: 1_111_998,
			unicodeRange: 'U+0000-10FFFF',
		});

		expect(catalog?.truncated).toBe(true);
		expect(catalog?.groups.all.length).toBeLessThanOrEqual(4096);
	});
});

describe('registry family classification', () => {
	it('uses registry specialist tags when they are available', () => {
		expect(
			isIconFontFamily(
				{ id: 'catalog-icons', category: 'other' },
				{ ...family, tags: ['special-use/icons'] },
			),
		).toBe(true);
	});

	it('keeps legacy specialist detection while tags are being backfilled', () => {
		expect(
			isDigitalFontFamily({ id: 'dseg7-classic', category: 'other' }, family),
		).toBe(true);
		expect(
			isPunctuationFontFamily({ id: 'yakuhanjp', category: 'other' }, family),
		).toBe(true);
	});
});

describe('selectRegistryFamilyLanguages', () => {
	it('returns only family languages with the primary language first', () => {
		const languages = [
			{ id: 'de_Latn', language: 'de', script: 'Latn', name: 'German' },
			{ id: 'en_Latn', language: 'en', script: 'Latn', name: 'English' },
			{ id: 'fr_Latn', language: 'fr', script: 'Latn', name: 'French' },
		];
		const registryFamily = {
			...family,
			languages: ['en_Latn', 'de_Latn'],
			primaryLanguage: 'en_Latn',
		};

		expect(
			selectRegistryFamilyLanguages(registryFamily, languages, 2)?.map(
				(language) => language.id,
			),
		).toEqual(['en_Latn', 'de_Latn']);
	});
});
