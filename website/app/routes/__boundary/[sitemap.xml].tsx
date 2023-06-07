import { fileURLToPath } from 'node:url';

import type { LoaderFunction } from '@remix-run/node';
import path from 'pathe';
import { SitemapStream, streamToPromise } from 'sitemap';

import { getAllSlugsInDir, kya } from '@/utils/utils.server';

export const loader: LoaderFunction = async () => {
	const smStream = new SitemapStream({ hostname: 'https://fontsource.org' });

	// Pipe base urls to stream
	smStream.write({ url: '/', changefreq: 'daily', priority: 0.9 });

	// Pipe each font to stream
	const fontlist: Record<string, string> = await kya(
		'https://api.fontsource.org/fontlist?family'
	);

	for (const id of Object.keys(fontlist)) {
		smStream.write({
			url: `/fonts/${id}`,
			changefreq: 'weekly',
			priority: 0.5,
		});
	}

	// Pipe all docs to stream
	const slugs = await getAllSlugsInDir(
		path.join(path.dirname(fileURLToPath(import.meta.url)), '../docs')
	);

	for (const slug of slugs) {
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
		},
	});
};
