import type { LoaderFunctionArgs } from 'react-router';

import { cacheHeaders } from '@/utils/cache';
import { searchDocs } from '@/utils/docs/source.server';

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get('query')?.trim() ?? '';
	if (query.length < 2)
		return Response.json([], { headers: cacheHeaders.short });

	const results = await searchDocs(query, 8);

	return Response.json(results, { headers: cacheHeaders.short });
};
