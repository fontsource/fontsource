import { observable } from '@legendapp/state';
import { describe, expect, it } from 'vitest';
import type {
	GetFontResponse,
	GetRegistrySourceCapabilitiesResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import {
	getRecommendedPreviewLanguage,
	getRecommendedPreviewText,
} from '@/utils/language/language';
import { previewText } from '@/utils/preview-text';
import type { RegistryFamily } from '@/utils/registry';

import {
	createPreviewEditorSetup,
	getActivePreviewText,
	type PreviewEditorModel,
} from './FamilyPreviewState';

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

const createModel = (family: RegistryFamily = registry): PreviewEditorModel => {
	const props = {
		metadata,
		registry: family,
		languages,
		capabilities,
		capabilitySource: source,
		previewCSS: '',
	};
	const { editorValue, ...setup } = createPreviewEditorSetup(props);
	return { ...props, ...setup, state$: observable(editorValue) };
};

describe('preview samples', () => {
	it.each([false, true])(
		'preserves curated short and long samples with symbol mode %s',
		(symbols) => {
			const model = createModel({
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
			});
			expect(getActivePreviewText(model)).toBe('home search');
			model.state$.mode.set('paragraph');
			expect(getActivePreviewText(model)).toBe('home search favorite settings');
		},
	);

	it('prefers the default subset over an unrelated primary script sample', () => {
		const model = createModel({ ...registry, primaryScript: 'Deva' });
		model.languages = [
			...languages,
			{
				id: 'bap_Deva',
				language: 'bap',
				script: 'Deva',
				name: 'Bantawa',
				direction: 'ltr',
				sampleText: { short: 'झाराक मनाचि' },
			},
		];
		const text = getActivePreviewText(model);
		expect(text).toBe(previewText.language.subsets.latin);
		expect(text).toBe(
			getRecommendedPreviewText(
				{ ...metadata, ...model.registry },
				'short',
				model.languages,
			),
		);
		model.state$.typographyByMode.headline.weight.set(700);
		expect(getActivePreviewText(model)).toBe(text);
	});

	it('preserves explicit preview subsets and primary languages', () => {
		expect(
			getRecommendedPreviewText({ ...metadata, previewSubset: 'devanagari' }),
		).toBe(previewText.language.subsets.devanagari);
		expect(
			getRecommendedPreviewText(
				{ ...metadata, primaryLanguage: 'aa_Latn' },
				'short',
				languages,
			),
		).toBe(languages[0].sampleText.short);
	});

	it('derives direction from the recommended script sample', () => {
		const arabic = {
			id: 'ar_Arab',
			language: 'ar',
			script: 'Arab',
			name: 'Arabic',
			direction: 'rtl' as const,
			sampleText: { short: 'اختبار' },
		};
		const family = { ...registry, primaryScript: 'Arab', defSubset: 'custom' };
		expect(getRecommendedPreviewLanguage(family, [arabic])?.direction).toBe(
			'rtl',
		);
		expect(
			getRecommendedPreviewText({ ...metadata, ...family }, 'short', [arabic]),
		).toBe(arabic.sampleText.short);
	});

	it('keeps mapped glyphs for symbol fonts without a curated specimen', () => {
		const model = createModel({
			...registry,
			symbols: { catalogUrl: '/symbols', inputModes: ['codepoint'] },
		});
		model.capabilities = { ...capabilities, unicodeRange: 'U+2600-2602' };
		expect(getActivePreviewText(model)).toBe('☀☁☂');
	});

	it('shares custom text across views, preserves empty edits, and returns to the selected sample', () => {
		const model = createModel();
		model.state$.selectedLanguageId.set('aa_Latn');
		expect(getActivePreviewText(model)).toBe('Seehada');
		model.state$.customText.set('My own text');
		for (const mode of [
			'headline',
			'paragraph',
			'waterfall',
			'compare',
		] as const) {
			model.state$.mode.set(mode);
			expect(getActivePreviewText(model)).toBe('My own text');
		}
		model.state$.customText.set('');
		expect(getActivePreviewText(model)).toBe('');
		model.state$.customText.set(null);
		model.state$.mode.set('paragraph');
		expect(getActivePreviewText(model)).toBe('Seehada le karaamat.');
		model.state$.selectedLanguageId.set('');
		expect(getActivePreviewText(model)).toBe(
			getRecommendedPreviewText(
				{ ...metadata, ...registry },
				'short',
				languages,
			),
		);
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
