import type { LoaderFunctionArgs } from 'react-router';
import { beforeEach, expect, it, vi } from 'vitest';

const searchForHits = vi.hoisted(() => vi.fn());

vi.mock('@/utils/algolia-client', () => ({
	DEFAULT_SEARCH_INDEX: 'prod_POPULAR',
	searchClient: { searchForHits },
}));

import { loader } from '../../app/routes/resources.font-suggestions';

const load = (query: string) =>
	loader({
		request: new Request(
			`https://fontsource.org/resources/font-suggestions?${new URLSearchParams({ query })}`,
		),
	} as LoaderFunctionArgs);

beforeEach(() => searchForHits.mockReset());

it('returns only the five-hit suggestion fields with public caching', async () => {
	searchForHits.mockResolvedValue({
		results: [
			{
				hits: [
					{
						objectID: 'roboto',
						family: 'Roboto',
						category: 'sans-serif',
						internal: 'unused',
					},
				],
			},
		],
	});

	const response = await load('  robo  ');
	const hits = await response.json();
	expect(response.status).toBe(200);
	expect(response.headers.get('Cache-Control')).toContain('max-age=300');
	expect(hits).toEqual([
		{ objectID: 'roboto', family: 'Roboto', category: 'sans-serif' },
	]);
	expect(searchForHits).toHaveBeenCalledWith({
		requests: [
			{
				indexName: 'prod_POPULAR',
				query: 'robo',
				hitsPerPage: 5,
				attributesToRetrieve: ['family', 'category'],
				attributesToHighlight: [],
			},
		],
	});
});

it('does not search for empty or overlong suggestions', async () => {
	expect(await (await load('   ')).json()).toEqual([]);
	const response = await load('x'.repeat(513));
	expect(response.status).toBe(400);
	expect(response.headers.get('Cache-Control')).toBe('no-store');
	expect(searchForHits).not.toHaveBeenCalled();
});
