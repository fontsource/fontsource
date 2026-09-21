import type { SearchClient } from 'instantsearch.js';
import { RouterContextProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
	getRegistryLanguageIndex,
	getRegistryTaxonomy,
	listFontValues,
	listRegistryFamilies,
	listRegistryLanguages,
} from '@/generated/api';
import { getSearchServerState, loader } from '@/utils/search.server';
import { createLanguageSearchClient } from './language-facets';

vi.mock('@/generated/api', () => ({
	listFontValues: vi.fn().mockResolvedValue({}),
	getRegistryLanguageIndex: vi.fn().mockResolvedValue({
		version: 'a'.repeat(64),
		families: [],
		languages: {},
	}),
	listRegistryFamilies: vi.fn(),
	listRegistryLanguages: vi.fn().mockResolvedValue([
		{
			id: 'ja_Jpan',
			language: 'ja',
			script: 'Jpan',
			name: 'Japanese',
			autonym: '日本語',
		},
	]),
	getRegistryTaxonomy: vi.fn().mockResolvedValue({
		classifications: { symbols: { label: 'Symbols' } },
		tags: {},
		tagGroups: {},
	}),
}));

it('loads published registry previews for client-only collection searches', async () => {
	vi.mocked(listRegistryFamilies).mockResolvedValue([
		{
			id: 'material-icons',
			family: 'Material Icons',
			provider: 'google-icons',
			status: 'active',
			classifications: ['symbols'],
			tags: [],
			axes: [],
			sourceModified: '2026-09-18',
			license: {
				id: 'Apache-2.0',
				url: 'https://www.apache.org/licenses/LICENSE-2.0',
			},
			sampleText: { short: 'search favorite' },
			previewContext: { fallbackFamilies: ['sans-serif'] },
		},
	]);
	vi.mocked(getRegistryLanguageIndex).mockResolvedValueOnce({
		version: 'a'.repeat(64),
		families: ['material-icons'],
		languages: {},
	});
	vi.mocked(listFontValues).mockResolvedValueOnce({
		'material-icons': 'google',
		'legacy-font': 'google',
	});
	const result = await loader({
		request: new Request('https://fontsource.org/?collection=example'),
		url: new URL('https://fontsource.org/?collection=example'),
		pattern: '/',
		params: {},
		context: new RouterContextProvider(),
	});
	expect(result.data.legacyFamilyIds).toEqual(['legacy-font']);
	expect(result.data.languages).toEqual([
		expect.objectContaining({ id: 'ja_Jpan', autonym: '日本語' }),
	]);
	expect(result.data.taxonomy.classifications.symbols).toEqual({
		label: 'Symbols',
	});
	expect(result.data.previews['material-icons']).toEqual({
		sampleText: { short: 'search favorite' },
		previewContext: { fallbackFamilies: ['sans-serif'] },
	});
});

describe('getSearchServerState', () => {
	it('renders apostrophe queries with search results', async () => {
		const search = vi.fn().mockResolvedValue({
			results: [
				{
					hits: [
						{
							objectID: 'yakuhan-jp',
							family: 'Yaku Han JP',
							defSubset: 'latin',
							category: 'sans-serif',
							variable: false,
						},
					],
					index: 'prod_POPULAR',
					hitsPerPage: 12,
					nbHits: 1,
					nbPages: 1,
					page: 0,
					processingTimeMS: 1,
					query: "yakuhan'",
				},
			],
		});
		const client = { search } as unknown as SearchClient;

		const state = await getSearchServerState(
			'https://fontsource.org/?query=yakuhan%27',
			{
				languages: await listRegistryLanguages(),
				taxonomy: await getRegistryTaxonomy(),
			},
			undefined,
			client,
		);

		expect(state.initialResults).toBeDefined();
		expect(search).toHaveBeenCalled();
	});
});

it('preserves legacy filters alongside registry filters in SSR requests', async () => {
	const search = vi.fn().mockImplementation((requests) =>
		Promise.resolve({
			results: requests.map((request: { indexName: string }) => ({
				hits: [],
				index: request.indexName,
				hitsPerPage: 12,
				nbHits: 0,
				nbPages: 0,
				page: 0,
				processingTimeMS: 1,
				query: '',
			})),
		}),
	);
	await getSearchServerState(
		'https://fontsource.org/?category=icons&subsets=japanese&classifications=symbols,display&languages=ja_Jpan,zh_Hant',
		{
			languages: await listRegistryLanguages(),
			taxonomy: await getRegistryTaxonomy(),
		},
		undefined,
		{ search } as unknown as SearchClient,
	);
	const filters = search.mock.calls[0][0][0].params.facetFilters;
	expect(filters).toEqual(
		expect.arrayContaining([
			['category:icons'],
			'subsets:japanese',
			'languageIds:ja_Jpan',
			'languageIds:zh_Hant',
			expect.arrayContaining([
				'classifications:symbols',
				'classifications:display',
			]),
		]),
	);
});

it('hydrates complete language counts rather than capped Algolia facets', async () => {
	const search = vi.fn().mockImplementation((requests) =>
		Promise.resolve({
			results: requests.map((request: { indexName: string }) => ({
				hits: [
					{
						objectID: 'old-persian',
						languageIndexVersion: 'a'.repeat(64),
						family: 'Old Persian',
						defSubset: 'latin',
						category: 'sans-serif',
						variable: false,
					},
				],
				index: request.indexName,
				hitsPerPage: 12,
				nbHits: 1,
				nbPages: 1,
				page: 0,
				processingTimeMS: 0,
				query: '',
				exhaustiveNbHits: true,
				facets: { languageIds: {} },
			})),
		}),
	);
	const languages = Array.from({ length: 1700 }, (_, i) => ({
		id: `language-${i}`,
		language: 'en',
		script: 'Latn',
		name: `Language ${i}`,
	}));
	const state = await getSearchServerState(
		'https://fontsource.org/',
		{
			languages,
			taxonomy: await getRegistryTaxonomy(),
		},
		undefined,
		createLanguageSearchClient({ search } as unknown as SearchClient, {
			version: 'a'.repeat(64),
			families: ['old-persian'],
			languages: Object.fromEntries(languages.map(({ id }) => [id, 'AQ=='])),
		}),
	);
	const facets =
		state.initialResults.prod_POPULAR.results?.[0].facets?.languageIds;
	expect(Object.keys(facets ?? {})).toHaveLength(1700);
	expect(facets?.['language-1699']).toBe(1);
	expect(search).toHaveBeenCalledOnce();
});

it('keeps collection search available when membership has not been published', async () => {
	vi.mocked(getRegistryLanguageIndex).mockRejectedValueOnce(
		new Error('snapshot missing'),
	);
	vi.mocked(listFontValues).mockResolvedValueOnce({ 'legacy-font': 'google' });
	const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		const result = await loader({
			request: new Request('https://fontsource.org/?collection=example'),
			url: new URL('https://fontsource.org/?collection=example'),
			pattern: '/',
			params: {},
			context: new RouterContextProvider(),
		});
		expect(result.data.languageIndex).toBeNull();
		expect(result.data.legacyFamilyIds).toEqual([]);
		expect(result.data.hasCollectionFilter).toBe(true);
		expect(warning).toHaveBeenCalledOnce();
	} finally {
		warning.mockRestore();
	}
});

it('keeps search available when the legacy font catalog cannot be loaded', async () => {
	vi.mocked(listFontValues).mockRejectedValueOnce(new Error('offline'));
	const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
	try {
		const result = await loader({
			request: new Request('https://fontsource.org/?collection=example'),
			url: new URL('https://fontsource.org/?collection=example'),
			pattern: '/',
			params: {},
			context: new RouterContextProvider(),
		});
		expect(result.data.legacyFamilyIds).toEqual([]);
		expect(result.data.languageIndex).not.toBeNull();
	} finally {
		warning.mockRestore();
	}
});
