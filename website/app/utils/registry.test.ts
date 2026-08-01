import { describe, expect, it } from 'vitest';

import type {
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
} from '@/generated/api';

import {
	findUnmappedCharacters,
	getRegistryCharacterGroups,
	hasSymbolCatalog,
	isDigitalFontFamily,
	isPunctuationFontFamily,
	type RegistryFamily,
	selectRegistryDistributionSource,
	selectRegistryFamilyLanguages,
	usesNameLigatures,
	validateRegistryFamily,
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

describe('selectRegistryDistributionSource', () => {
	it('prefers the normal standard variable distribution source', () => {
		expect(
			selectRegistryDistributionSource(family, {
				format: 'variable',
				style: 'normal',
			})?.sha256,
		).toBe('variable-standard');
	});

	it('selects the requested static distribution source', () => {
		const staticFamily = {
			...family,
			distribution: {
				static: [
					{ weight: 400, style: 'normal' as const, source: 'static-400' },
				],
				characters: { type: 'all' as const },
			},
		};
		expect(
			selectRegistryDistributionSource(staticFamily, {
				format: 'static',
				style: 'normal',
				weight: 400,
			})?.sha256,
		).toBe('static-400');
	});

	it('does not fall back to a raw source missing from distribution', () => {
		const invalidFamily = {
			...family,
			distribution: {
				static: [{ weight: 400, style: 'normal' as const, source: 'missing' }],
				characters: { type: 'all' as const },
			},
		};

		expect(
			selectRegistryDistributionSource(invalidFamily, {
				format: 'static',
				style: 'normal',
				weight: 400,
			}),
		).toBeUndefined();
	});

	it('does not report capabilities from a different style', () => {
		const italicFamily = {
			...family,
			distribution: {
				static: [
					{ weight: 400, style: 'italic' as const, source: 'static-400' },
				],
				characters: { type: 'all' as const },
			},
		};

		expect(
			selectRegistryDistributionSource(italicFamily, {
				format: 'static',
				style: 'normal',
				weight: 400,
			}),
		).toBeUndefined();
	});

	it('does not fall through to a different distributed format', () => {
		const variableOnlyFamily = {
			...family,
			distribution: {
				variable: family.distribution.variable,
				characters: { type: 'all' as const },
			},
		};

		expect(
			selectRegistryDistributionSource(variableOnlyFamily, {
				format: 'static',
				style: 'normal',
				weight: 400,
			}),
		).toBeUndefined();
	});
});

describe('validateRegistryFamily', () => {
	it('accepts the future required contract and explicit symbol semantics', () => {
		const symbols = {
			catalogUrl: '/v1/registry/families/example/symbols',
			inputModes: ['codepoint', 'name-ligature'],
		};
		const candidate = {
			...family,
			symbols,
		} as unknown as GetRegistryFamilyResponse;

		expect(validateRegistryFamily(candidate)).toMatchObject({
			id: 'example',
			symbols,
		});
	});

	it('rejects incomplete records before the UI treats them as authoritative', () => {
		expect(
			validateRegistryFamily({
				...family,
				distribution: undefined,
			} as unknown as GetRegistryFamilyResponse),
		).toBeUndefined();
		expect(
			validateRegistryFamily({
				...family,
				license: { ...family.license, text: '  ' },
			} as GetRegistryFamilyResponse),
		).toBeUndefined();
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
	it('uses reviewed specialist tags without family ID inference', () => {
		expect(
			isDigitalFontFamily({
				...family,
				id: 'unrelated-name',
				tags: ['special-use/digital-display'],
			}),
		).toBe(true);
		expect(
			isPunctuationFontFamily({
				...family,
				id: 'unrelated-name',
				tags: ['special-use/punctuation'],
			}),
		).toBe(true);
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

		expect(hasSymbolCatalog(symbolFamily)).toBe(true);
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
