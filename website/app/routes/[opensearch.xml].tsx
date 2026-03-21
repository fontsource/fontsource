import type { LoaderFunction } from 'react-router';

export const loader: LoaderFunction = async ({ request }) => {
	const { origin } = new URL(request.url);
	const iconUrl = `${origin}/favicon-16x16.png`;
	const searchUrl = `${origin}/?query={searchTerms}`;
	const selfUrl = `${origin}/opensearch.xml`;

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
	<ShortName>Fontsource</ShortName>
	<Description>Search fonts on Fontsource</Description>
	<InputEncoding>UTF-8</InputEncoding>
	<Image width="16" height="16" type="image/png">${iconUrl}</Image>
	<Url type="text/html" template="${searchUrl}" />
	<Url type="application/opensearchdescription+xml" rel="self" template="${selfUrl}" />
</OpenSearchDescription>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/opensearchdescription+xml',
			'Cache-Control': 'public, max-age=86400', // 1 day
		},
	});
};
