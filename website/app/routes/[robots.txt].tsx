import type { LoaderFunction } from 'react-router';

import { cacheHeaders } from '@/utils/cache';

const prod = `User-agent: *
Allow: /

Sitemap: https://fontsource.org/sitemap.xml`;

export const loader: LoaderFunction = async () => {
	return new Response(prod, {
		headers: {
			'Content-Type': 'text/plain',
			...cacheHeaders.stable,
		},
	});
};
