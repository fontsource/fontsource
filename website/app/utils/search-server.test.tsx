import type { SearchClient } from 'instantsearch.js';
import { describe, expect, it, vi } from 'vitest';

import { getSearchServerState } from '@/routes/_index';

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
