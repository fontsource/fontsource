import { describe, expect, it } from 'vitest';

import type {
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
} from '@/generated/api';

import {
	findUnmappedCharacters,
	getRegistryCharacterGroups,
	getRegistryFamilyKind,
	getUnicodeCharacter,
	type RegistryFamily,
	selectRegistryFamilyLanguages,
	usesNameLigatures,
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
	license: {
		id: 'OFL-1.1',
		url: 'https://example.com/license',
		text: 'License text',
	},
	sources: [
		source('static-400', 'static', 400),
		source('variable-standard', 'variable', 400),
	],
	previewSource: 'variable-standard',
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
} satisfies RegistryFamily;

const capabilities = {
	glyphCount: 6,
	codepointCount: 6,
	unicodeRange: 'U+0021, U+0031, U+0041, U+0061, U+00A9, U+0301',
	features: { gsub: ['liga'], gpos: ['kern'] },
	outline: 'glyf',
	colorTables: [],
} satisfies GetRegistrySourceCapabilitiesResponse;

describe('registry character capabilities', () => {
	it('groups exact mapped characters without invisible codepoints', () => {
		expect(getRegistryCharacterGroups(capabilities)).toEqual({
			all: ['!', '1', 'A', 'a', '©', '́'],
			letters: ['A', 'a', '́'],
			numbers: ['1'],
			punctuation: ['!'],
			symbols: ['©'],
		});
	});

	it('reports unique visible characters without a cmap entry', () => {
		expect(findUnmappedCharacters('A B? B', capabilities)).toEqual(['B', '?']);
	});

	it('returns every browsable mapped character', () => {
		const groups = getRegistryCharacterGroups({
			...capabilities,
			glyphCount: 5_120,
			codepointCount: 5_120,
			unicodeRange: 'U+1000-23FF',
		});

		expect(groups?.all.length).toBeGreaterThan(4_096);
	});

	it('ignores malformed, reversed, and out-of-range capability entries', () => {
		expect(
			getRegistryCharacterGroups({
				...capabilities,
				unicodeRange: 'invalid, U+110000, U+0042-0041, U+0041',
			}),
		).toEqual({
			all: ['A'],
			letters: ['A'],
			numbers: [],
			punctuation: [],
			symbols: [],
		});
	});

	it('rejects values that are not Unicode scalar values', () => {
		expect(getUnicodeCharacter(0x41)).toBe('A');
		expect(getUnicodeCharacter(-1)).toBeUndefined();
		expect(getUnicodeCharacter(0xd800)).toBeUndefined();
		expect(getUnicodeCharacter(0x110000)).toBeUndefined();
	});
});

describe('registry family classification', () => {
	it('uses reviewed specialist tags without family ID inference', () => {
		expect(
			getRegistryFamilyKind({
				...family,
				id: 'unrelated-name',
				tags: ['special-use/digital-display'],
			}),
		).toBe('digital');
		expect(
			getRegistryFamilyKind({
				...family,
				id: 'unrelated-name',
				classifications: ['sans-serif', 'symbols'],
				tags: ['special-use/punctuation'],
			}),
		).toBe('punctuation');
	});

	it('requires explicit catalog semantics for named ligatures', () => {
		const symbolFamily: RegistryFamily = {
			...family,
			classifications: ['symbols'],
			symbols: {
				catalogUrl: '/v1/registry/families/example/symbols',
				inputModes: ['codepoint', 'name-ligature'],
			},
		};

		expect(usesNameLigatures(symbolFamily)).toBe(true);
		expect(
			usesNameLigatures({
				...symbolFamily,
				symbols: {
					catalogUrl: '/v1/registry/families/example/symbols',
					inputModes: ['codepoint'],
				},
			}),
		).toBe(false);
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
