export const API_CATALOG_CONTENT_TYPE =
	'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"';

export const API_CATALOG_LINK =
	'<https://fontsource.org/.well-known/api-catalog>; rel="api-catalog"';

export const API_CATALOG = {
	linkset: [
		{
			anchor: 'https://api.fontsource.org/',
			'service-desc': [
				{
					href: 'https://api.fontsource.org/openapi.json',
					type: 'application/json',
				},
			],
			'service-doc': [
				{
					href: 'https://fontsource.org/docs/api/introduction',
					type: 'text/html',
				},
			],
		},
	],
};

export const HOME_DISCOVERY_LINKS = [
	API_CATALOG_LINK,
	'<https://api.fontsource.org/openapi.json>; rel="service-desc"; type="application/json"',
	'<https://fontsource.org/docs/api/introduction>; rel="service-doc"; type="text/html"',
	'<https://fontsource.org/llms.txt>; rel="describedby"; type="text/plain"',
];
