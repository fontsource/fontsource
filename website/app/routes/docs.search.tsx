import type { LoaderFunctionArgs } from 'react-router';

import { searchDocs } from '@/utils/docs/source.server';

const headers = {
	'Cache-Control': 'public, max-age=300',
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get('query')?.trim() ?? '';
	if (query.length < 2) return Response.json([], { headers });

	const results = await searchDocs(query, 8);

	return Response.json(results, { headers });
};
