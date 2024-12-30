import type { LoaderFunction } from '@remix-run/cloudflare';

const prod = `User-agent: *
Allow: /

Sitemap: https://fontsource.org/sitemap.xml`;

export const loader: LoaderFunction = async () => {
	return new Response(prod, {
		headers: {
			'Content-Type': 'text/plain',
			'Cache-Control': 'public, max-age=86400', // 1 day
		},
	});
};
