import type { LoaderFunction } from 'react-router';

import { cacheHeaders } from '@/utils/cache';
import { getAllDocsMarkdown } from '@/utils/docs/markdown.server';

export const loader: LoaderFunction = async () => {
	return new Response(await getAllDocsMarkdown(), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			...cacheHeaders.stable,
		},
	});
};
