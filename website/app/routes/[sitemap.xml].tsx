import type { LoaderFunction } from 'react-router';
import { SitemapStream, streamToPromise } from 'sitemap';
import { listFontValues } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import { loadDiscoveryData } from '@/utils/discovery.server';
import { source } from '@/utils/docs/source.server';

export const loader: LoaderFunction = async ({ request }) => {
	const smStream = new SitemapStream({ hostname: 'https://fontsource.org' });

	// Pipe base urls to stream
	smStream.write({ url: '/', changefreq: 'daily', priority: 0.9 });
	smStream.write({ url: '/browse', changefreq: 'weekly', priority: 0.7 });
	smStream.write({ url: '/tools', changefreq: 'weekly', priority: 0.7 });
	smStream.write({ url: '/privacy', changefreq: 'yearly', priority: 0.3 });
	smStream.write({
		url: '/tools/converter',
		changefreq: 'weekly',
		priority: 0.7,
	});
	smStream.write({
		url: '/tools/optimizer',
		changefreq: 'weekly',
		priority: 0.7,
	});

	// Pipe each font to stream
	const [fontlist, { pages }] = await Promise.all([
		listFontValues({ family: '' }, { signal: request.signal }),
		loadDiscoveryData(request.signal),
	]);

	for (const id of Object.keys(fontlist)) {
		smStream.write({
			url: `/fonts/${id}`,
			changefreq: 'weekly',
			priority: 0.5,
		});
	}

	for (const page of pages.filter((page) => page.indexable)) {
		smStream.write({
			url: page.path,
			changefreq: 'weekly',
			priority: 0.7,
		});
	}

	for (const page of source.getPages()) {
		smStream.write({
			url: page.url,
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
			...cacheHeaders.stable,
		},
	});
};
