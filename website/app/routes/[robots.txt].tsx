import type { LoaderFunction } from '@remix-run/node';

export const loader: LoaderFunction = async () => {
	const prod = `User-agent: *
Allow: /

Sitemap: https://fontsource.org/sitemap.xml`;

	if (process.env.NODE_ENV === 'production') {
		return new Response(prod, {
			headers: {
				'Content-Type': 'text/plain',
			},
		});
	}

	const dev = `User-agent: *
Disallow: /`;

	return new Response(dev, {
		headers: {
			'Content-Type': 'text/plain',
		},
	});
};
