import type { LoaderFunction } from 'react-router';
import { SitemapStream, streamToPromise } from 'sitemap';

import { fetchApiData } from '@/utils/api.server';
import { SITE_ORIGIN } from '@/utils/meta';

const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400';
const STATIC_ROUTES = [
	{ url: '/', changefreq: 'daily' as const, priority: 0.9 },
	{ url: '/tools', changefreq: 'weekly' as const, priority: 0.7 },
	{ url: '/tools/converter', changefreq: 'weekly' as const, priority: 0.8 },
];

const docSlugs = Object.keys(import.meta.glob('../../docs/**/*.mdx'))
	.map((slug) => slug.replace('../../docs/', '').replace('.mdx', ''))
	.sort();

export const loader: LoaderFunction = async () => {
	const smStream = new SitemapStream({ hostname: SITE_ORIGIN });

	for (const route of STATIC_ROUTES) {
		smStream.write(route);
	}

	const fontlist = await fetchApiData<Record<string, string>>(
		'https://api.fontsource.org/fontlist?family',
	);

	for (const id of Object.keys(fontlist).sort()) {
		smStream.write({
			url: `/fonts/${id}`,
			changefreq: 'weekly',
			priority: 0.5,
		});
	}

	// Pipe all docs to stream
	for (const slug of docSlugs) {
		smStream.write({
			url: `/docs/${slug}`,
			changefreq: 'weekly',
			priority: 0.7,
		});
	}

	smStream.end();

	const sitemap = await streamToPromise(smStream).then((sm) => sm.toString());
	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': CACHE_CONTROL,
		},
	});
};
