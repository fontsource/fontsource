import type { LoaderFunctionArgs } from 'react-router';
import { DEFAULT_SEARCH_INDEX, searchClient } from '@/utils/algolia-client';
import { cacheHeaders } from '@/utils/cache';

interface FontMatch {
	objectID: string;
	family: string;
	category: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const query = new URL(request.url).searchParams.get('query')?.trim() ?? '';
	if (!query) return Response.json([], { headers: cacheHeaders.short });
	if (query.length > 512) {
		return Response.json([], { status: 400, headers: cacheHeaders.noStore });
	}

	const { results } = await searchClient.searchForHits<FontMatch>({
		requests: [
			{
				indexName: DEFAULT_SEARCH_INDEX,
				query,
				hitsPerPage: 5,
				attributesToRetrieve: ['family', 'category'],
				attributesToHighlight: [],
			},
		],
	});

	return Response.json(
		results[0].hits.map(({ objectID, family, category }) => ({
			objectID,
			family,
			category,
		})),
		{ headers: cacheHeaders.short },
	);
};
