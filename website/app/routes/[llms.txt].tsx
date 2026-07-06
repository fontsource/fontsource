import type { LoaderFunction } from 'react-router';

import { cacheHeaders } from '@/utils/cache';
import { getDocsLLMsIndex } from '@/utils/docs/source.server';

export const loader: LoaderFunction = async () => {
	return new Response(getDocsLLMsIndex(), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			...cacheHeaders.stable,
		},
	});
};
