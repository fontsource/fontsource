import { describe, expect, it } from 'vitest';

import type {
	GetFontResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import type { RegistryFamily } from '@/utils/registry';

import { createPreviewEditorSetup } from './FamilyPreviewState';

const metadata = {
	id: 'example',
	family: 'Example',
	weights: [400],
	styles: ['normal'],
	subsets: ['latin'],
	defSubset: 'latin',
	variable: false,
	lastModified: '2026-08-01',
	category: 'sans-serif',
	license: 'OFL-1.1',
	type: 'other',
	version: 'v1',
	source: 'https://example.com',
	unicodeRange: { latin: 'U+0000-10FFFF' },
	variants: {},
} satisfies GetFontResponse;

const source = {
	sha256: 'static-400',
	filename: 'Example-Regular.ttf',
	path: 'sources/Example-Regular.ttf',
	format: 'ttf',
	size: 1,
	downloadUrl: '/sources/Example-Regular.ttf',
	capabilitiesUrl: '/sources/Example-Regular.ttf/capabilities',
	fontVersion: null,
	glyphCount: 1,
	codepointCount: 1,
	style: 'normal',
	type: 'static',
	weight: 400,
} as const;

const registry = {
	id: 'example',
	family: 'Example',
	provider: 'fontsource',
	status: 'active',
	classifications: ['sans-serif'],
	tags: [],
	sourceModified: '2026-08-01',
	axes: [],
	languages: ['aa_Latn', 'en_Latn'],
	primaryScript: 'Latn',
	license: {
		id: 'OFL-1.1',
		url: 'https://example.com/license',
		text: 'License text',
	},
	provenance: { type: 'registry' },
	sources: [source],
	previewSource: source.sha256,
	distribution: {
		static: [{ weight: 400, style: 'normal', source: source.sha256 }],
		variable: [],
		characters: { type: 'all' },
	},
} satisfies RegistryFamily;

const languages = [
	{
		id: 'aa_Latn',
		language: 'aa',
		script: 'Latn',
		direction: 'ltr',
		name: 'Afar',
		sampleText: { short: 'Seehada', long: 'Seehada le karaamat.' },
	},
	{
		id: 'en_Latn',
		language: 'en',
		script: 'Latn',
		direction: 'ltr',
		name: 'English',
		sampleText: { short: 'English', long: 'English preview text.' },
	},
] satisfies ListRegistryLanguagesResponse;

const capabilities = {
	glyphCount: 1,
	codepointCount: 1,
	unicodeRange: 'U+0000-10FFFF',
	features: { gsub: [], gpos: [] },
	outline: 'glyf',
	colorTables: [],
} satisfies GetRegistrySourceCapabilitiesResponse;

describe('createPreviewEditorSetup', () => {
	it.each([false, true])(
		'preserves curated samples with symbol mode %s',
		(symbols) => {
			const { editorValue } = createPreviewEditorSetup({
				metadata,
				registry: {
					...registry,
					sampleText: {
						short: 'home search',
						long: 'home search favorite settings',
					},
					...(symbols
						? {
								symbols: {
									catalogUrl: '/symbols',
									inputModes: ['name-ligature' as const],
								},
							}
						: {}),
				},
				languages,
				capabilities,
				capabilitySource: source,
			});
			expect(editorValue.selectedLanguageId).toBe('');
			expect(editorValue.texts).toEqual({
				headline: 'home search',
				paragraph: 'home search favorite settings',
			});
		},
	);
	it('initializes preview copy from the selected English language', () => {
		const { editorValue } = createPreviewEditorSetup({
			metadata,
			registry,
			languages,
			capabilities,
			capabilitySource: source,
		});

		expect(editorValue.selectedLanguageId).toBe('en_Latn');
		expect(editorValue.texts).toEqual({
			headline: 'English',
			paragraph: 'English preview text.',
		});
	});
	it('verifies both samples against the current source while preserving language order', () => {
		const samples = [
			{ short: 'A\u2003\u200d\ue000', long: 'A\nA' },
			{ short: 'A', long: 'A\u0301' },
			{ short: '𐐀' },
			{ short: 'A', long: 'B' },
			{ short: '  ', long: 'A' },
		];
		const previewLanguages = samples.map((sampleText, index) => ({
			...languages[0],
			id: `sample-${index}`,
			sampleText,
		}));
		for (const [unicodeRange, supportedIndices] of [
			['U+0041, U+0301, U+10400', [1, 2]],
			['U+0041', []],
			['U+0041, U+E000', [0]],
		] as const) {
			const { editorValue } = createPreviewEditorSetup({
				metadata,
				registry,
				languages: previewLanguages,
				capabilities: { ...capabilities, unicodeRange },
				capabilitySource: source,
			});
			expect(editorValue.verifiedLanguagesBySource[source.sha256]).toEqual(
				supportedIndices.map((index) => previewLanguages[index]),
			);
		}
	});
});
