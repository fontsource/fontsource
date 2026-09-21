import { observable } from '@legendapp/state';
import type { SearchClient } from 'instantsearch.js';
import { RouterContextProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import {
	getRegistryLanguageIndex,
	getRegistryTaxonomy,
	listRegistryFamilies,
	listRegistryLanguages,
} from '@/generated/api';
import { getSearchServerState, loader } from '@/utils/search.server';
import type { DiscoveryPage } from './discovery';
import { createLanguageSearchClient } from './language-facets';
import { createPageSearchState, routing } from './search-config';

vi.mock('@/generated/api', () => ({
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
	const result = await loader({
		request: new Request('https://fontsource.org/?collection=example'),
		url: new URL('https://fontsource.org/?collection=example'),
		pattern: '/',
		params: {},
		context: new RouterContextProvider(),
	});
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
		'https://fontsource.org/?category=icons&subsets=japanese&classifications=symbols,display&languages=ja_Jpan,zh_Hant&tags=sans/geometric',
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
			'tags:sans/geometric',
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
		expect(result.data.hasCollectionFilter).toBe(true);
		expect(warning).toHaveBeenCalledOnce();
	} finally {
		warning.mockRestore();
	}
});

const taxonomyPages: DiscoveryPage[] = [
	{
		count: 20,
		description: 'Geometric sans-serif fonts',
		heading: 'Geometric Sans Serif Fonts',
		intro: 'Browse geometric sans-serif fonts.',
		kind: 'tag',
		label: 'Geometric',
		path: '/tags/sans/geometric',
		routeState: { tags: 'sans/geometric' },
		indexable: true,
	},
	{
		count: 20,
		description: 'Symbols fonts',
		heading: 'Symbols Fonts',
		intro: 'Browse symbols fonts.',
		kind: 'category',
		label: 'Symbols',
		path: '/categories/symbols',
		routeState: { classifications: 'symbols' },
		indexable: true,
	},
];

it.each(taxonomyPages)(
	'applies discovery defaults to SSR for $path',
	async (page) => {
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
			`https://fontsource.org${page.path}`,
			{
				languages: await listRegistryLanguages(),
				taxonomy: await getRegistryTaxonomy(),
			},
			page,
			{ search } as unknown as SearchClient,
		);
		const filters = search.mock.calls[0][0][0].params.facetFilters.flat();
		const [attribute, value] = Object.entries(page.routeState)[0];
		expect(filters).toEqual([`${attribute}:${value}`]);
	},
);

it('round-trips tag routing alongside collections, classification and sort', () => {
	const config = routing(
		'https://fontsource.org/',
		observable(createPageSearchState()),
	);
	const { stateMapping } = config;
	if (!stateMapping)
		throw new Error('Search routing must expose state mapping');
	const route = {
		tags: 'sans/geometric,theme/blackletter',
		classifications: 'sans-serif',
		collection: 'favorites',
		sort: 'name',
	};
	const state = stateMapping.routeToState(route);
	expect(state.prod_POPULAR.refinementList?.tags).toEqual([
		'sans/geometric',
		'theme/blackletter',
	]);
	expect(stateMapping.stateToRoute(state)).toEqual(route);
	expect(stateMapping.routeToState({}).prod_POPULAR.refinementList).toEqual({});
	expect(stateMapping.stateToRoute({ prod_POPULAR: {} })).toEqual({});
});
