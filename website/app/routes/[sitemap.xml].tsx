import type { LoaderFunction } from 'react-router';
import { SitemapStream, streamToPromise } from 'sitemap';

import { fetchApiData } from '@/utils/api.server';

const docSlugs = Object.keys(
	import.meta.glob('../../docs/**/*.mdx', {
		eager: true,
	}),
).map((slug) => slug.replace('../../docs/', '').replace('.mdx', ''));

export const loader: LoaderFunction = async () => {
	const smStream = new SitemapStream({ hostname: 'https://fontsource.org' });

	// Pipe base urls to stream
	smStream.write({ url: '/', changefreq: 'daily', priority: 0.9 });

	// Pipe each font to stream
	const fontlist: Record<string, string> = await fetchApiData(
		'https://api.fontsource.org/fontlist?family',
	);

	for (const id of Object.keys(fontlist)) {
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

	// End stream
	smStream.end();

	// Return response
	const sitemap = await streamToPromise(smStream).then((sm) => sm.toString());
	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=86400', // 1 day
		},
	});
};
