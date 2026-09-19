import type { SearchClient } from 'instantsearch.js';
import { RouterContextProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { listRegistryFamilies } from '@/generated/api';
import { getSearchServerState, loader } from '@/routes/_index';

vi.mock('@/generated/api', () => ({
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
		'https://fontsource.org/?category=icons&subsets=japanese&classifications=symbols,display&languages=ja_Jpan,zh_Hant&tags=theme/fantasy,purpose/headline',
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
			'tags:theme/fantasy',
			'tags:purpose/headline',
			expect.arrayContaining([
				'classifications:symbols',
				'classifications:display',
			]),
		]),
	);
});
