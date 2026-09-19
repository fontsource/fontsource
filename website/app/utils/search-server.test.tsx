import type { SearchClient } from 'instantsearch.js';
import { RouterContextProvider } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { listRegistryFamilies } from '@/generated/api';
import { getSearchServerState, loader } from '@/utils/search.server';

vi.mock('@/generated/api', () => ({ listRegistryFamilies: vi.fn() }));

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
