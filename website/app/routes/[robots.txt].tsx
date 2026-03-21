import type { LoaderFunction } from 'react-router';

import { toAbsoluteUrl } from '@/utils/meta';

const prod = `User-agent: *
Allow: /

Sitemap: ${toAbsoluteUrl('/sitemap.xml')}`;

export const loader: LoaderFunction = async () => {
	return new Response(prod, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400', // 1 day
		},
	});
};
