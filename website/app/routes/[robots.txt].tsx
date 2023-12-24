import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async () => {
	const prod = `User-agent: *
Allow: /

Sitemap: https://fontsource.org/sitemap.xml`;

	const headers = {
		'Content-Type': 'text/plain',
		'Cache-Control': 'public, max-age=86400', // 1 day
	};

	if (process.env.FLY_APP_NAME === 'fontsource') {
		return new Response(prod, {
			headers,
		});
	}

	const dev = `User-agent: *
Disallow: /`;

	return new Response(dev, {
		headers,
	});
};
