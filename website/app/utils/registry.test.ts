import { describe, expect, it } from 'vitest';

import type {
	GetRegistryFamilyResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';

import {
	findUnmappedCharacters,
	getRegistryCharacterGroups,
	getRegistryPreviewText,
	getRegistrySourcePreviewStyle,
	getUnicodeCharacter,
	type RegistryFamily,
	selectRegistryPreviewLanguage,
} from './registry';

const source = (sha256: string, type: 'static' | 'variable', weight: number) =>
	({
		sha256,
		filename: `${sha256}.ttf`,
		path: `files/${sha256}.ttf`,
		format: 'ttf',
		size: 1,
		glyphCount: 1,
		codepointCount: 1,
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
	provenance: { type: 'registry' },
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
	glyphCount: 7,
	codepointCount: 7,
	unicodeRange: 'U+0021, U+0031, U+0041, U+0061, U+00A9, U+0301, U+E000',
	features: { gsub: ['liga'], gpos: ['kern'] },
	outline: 'glyf',
	colorTables: [],
} satisfies GetRegistrySourceCapabilitiesResponse;

describe('registry character capabilities', () => {
	it('groups exact mapped characters without invisible codepoints', () => {
		const groups = getRegistryCharacterGroups(capabilities);

		expect(groups).toEqual({
			all: ['!', '1', 'A', 'a', '©', '́', '\uE000'],
			letters: ['A', 'a'],
			marks: ['́'],
			numbers: ['1'],
			punctuation: ['!'],
			symbols: ['©', '\uE000'],
		});
		for (const characters of Object.values(groups ?? {})) {
			expect(groups?.all).toEqual(expect.arrayContaining(characters));
		}
	});

	it('includes supplementary private-use mappings but excludes controls and separators', () => {
		const groups = getRegistryCharacterGroups({
			...capabilities,
			unicodeRange: 'U+0000, U+0020, U+0378, U+200D, U+E000, U+F0000, U+100000',
		});
		expect(groups?.all).toEqual(['\uE000', '\u{F0000}', '\u{100000}']);
		expect(groups?.symbols).toEqual(groups?.all);
	});

	it('reports unique visible characters without a cmap entry', () => {
		expect(findUnmappedCharacters('A B? B', capabilities)).toEqual(['B', '?']);
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
			marks: [],
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

describe('registry preview source', () => {
	it('uses the source-scoped face for glyph rendering', () => {
		expect(
			getRegistrySourcePreviewStyle({
				...source('static-700', 'static', 700),
				style: 'oblique',
				declaredVariant: { weight: 600, style: 'italic' },
			}),
		).toEqual({ fontStyle: 'italic', fontWeight: 600 });
		const variableSource = source(
			'variable-standard',
			'variable',
			400,
		) as Extract<
			GetRegistryFamilyResponse['sources'][number],
			{ type: 'variable' }
		>;
		expect(
			getRegistrySourcePreviewStyle({
				...variableSource,
				weight: { min: 100, max: 900, default: 450 },
			}),
		).toEqual({ fontStyle: 'normal', fontWeight: 450 });
	});
});

describe('registry preview language', () => {
	const languages = [
		{
			id: 'ain_Kana',
			language: 'ain',
			script: 'Kana',
			direction: 'ltr',
			name: 'Ainu',
			sampleText: { short: 'アイヌ語' },
		},
		{
			id: 'ja_Jpan',
			language: 'ja',
			script: 'Jpan',
			direction: 'ltr',
			name: 'Japanese',
			sampleText: {
				short: '美しい日本語',
				long: '読みやすい日本語の文章です。',
			},
		},
	] satisfies ListRegistryLanguagesResponse;
	const japaneseFamily = {
		...family,
		languages: ['ain_Kana', 'ja_Jpan'],
		primaryScript: 'Jpan',
	};

	it('selects a sampled family language matching the primary script', () => {
		expect(selectRegistryPreviewLanguage(japaneseFamily, languages)?.id).toBe(
			'ja_Jpan',
		);
		expect(getRegistryPreviewText(japaneseFamily, languages)).toBe(
			'美しい日本語',
		);
		expect(getRegistryPreviewText(japaneseFamily, languages, 'long')).toBe(
			'読みやすい日本語の文章です。',
		);
	});

	it('keeps the reviewed family sample authoritative', () => {
		expect(
			getRegistryPreviewText(
				{
					...japaneseFamily,
					sampleText: { short: '家族の見本' },
				},
				languages,
			),
		).toBe('家族の見本');
	});
});
