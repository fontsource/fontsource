import type { LoaderFunction } from 'react-router';

import {
	API_CATALOG,
	API_CATALOG_CONTENT_TYPE,
	API_CATALOG_LINK,
} from '@/utils/agent-discovery';
import { cacheHeaders } from '@/utils/cache';

export const loader: LoaderFunction = async () => {
	return new Response(JSON.stringify(API_CATALOG), {
		headers: {
			'Content-Type': API_CATALOG_CONTENT_TYPE,
			Link: API_CATALOG_LINK,
			...cacheHeaders.stable,
		},
	});
};
