import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { etag, RETAINED_304_HEADERS } from 'hono/etag';
import { HTTPException } from 'hono/http-exception';

import { CACHE_HEADERS } from './constants';
import type { AppEnv } from './env';
import {
	GetFontRoute,
	GetFontStatsRoute,
	GetFontVersionsRoute,
	GetVariableFontRoute,
	ListAxisRegistryRoute,
	ListFontsRoute,
	ListFontValuesRoute,
	ListStatsRoute,
	ListVariableFontsRoute,
} from './routes/api';
import { GetBinaryAssetRoute, GetCssFileRoute } from './routes/cdn';
import {
	DownloadFontRoute,
	LegacyFontFileRedirectRoute,
} from './routes/compat';
import { DEFAULT_NOT_FOUND_MESSAGE, toErrorResponse } from './utils/errors';

const app = new Hono<AppEnv>();

app.use('*', cors());

/**
 * Default cache policy for JSON API responses. CDN and download handlers set
 * their own Cache-Control, so this only applies when no handler has claimed the
 * header and the response succeeded.
 */
app.use('*', async (c, next) => {
	await next();
	if (c.res.status < 400 && !c.res.headers.has('Cache-Control')) {
		c.header('Cache-Control', CACHE_HEADERS.api);
	}
	if (
		c.res.status < 400 &&
		!c.res.headers.has('CDN-Cache-Control') &&
		(c.res.headers.get('Content-Type')?.includes('application/json') ||
			c.res.headers.get('Cache-Control') === CACHE_HEADERS.api)
	) {
		c.header('CDN-Cache-Control', CACHE_HEADERS.apiEdge);
	}
});

// Registered on the Hono app before chanfana so that route classes don't need
// to carry middleware in their registration call (chanfana's typed `.get()`
// only accepts two arguments: path + endpoint class).

const apiEtag = etag({
	retainedHeaders: [
		'cdn-cache-control',
		'content-type',
		'last-modified',
		...RETAINED_304_HEADERS,
	],
});

for (const path of [
	'/fontlist',
	'/v1/fonts',
	'/v1/fonts/:id',
	'/v1/variable',
	'/v1/variable/:id',
	'/v1/axis-registry',
	'/v1/stats',
	'/v1/stats/:id',
	'/v1/version/:id',
] as const) {
	app.use(path, apiEtag);
}

app.use('/css/*', apiEtag);

const openapi = fromHono(app, {
	docs_url: '/docs',
	openapi_url: '/openapi.json',
	redoc_url: null,
	openapiVersion: '3.1',
	generateOperationIds: true,
	raiseUnknownParameters: false,
	schema: {
		info: {
			title: 'Fontsource API',
			version: '1.0.0',
			description: 'Public API for Fontsource self-hosted font distribution.',
			contact: {
				name: 'Fontsource',
				url: 'https://fontsource.org',
			},
			license: {
				name: 'MIT',
				url: 'https://github.com/fontsource/fontsource/blob/main/LICENSE',
			},
		},
		servers: [
			{
				url: '/',
				description: 'Current deployment',
			},
			{
				url: 'https://api.fontsource.org',
				description: 'Production',
			},
		],
		tags: [
			{
				name: 'Metadata',
				description:
					'Font catalog, variable metadata, axis registry, statistics, and version information.',
			},
			{
				name: 'CDN',
				description: 'Binary font assets and generated CSS stylesheets.',
			},
			{
				name: 'Downloads',
				description: 'Pre-built font download packages.',
			},
			{
				name: 'Compatibility',
				description: 'Legacy redirect endpoints for backward compatibility.',
			},
		],
	},
});

openapi.get('/fontlist', ListFontValuesRoute);
openapi.get('/v1/fonts', ListFontsRoute);
openapi.get('/v1/fonts/:id', GetFontRoute);
openapi.get('/v1/variable', ListVariableFontsRoute);
openapi.get('/v1/variable/:id', GetVariableFontRoute);
openapi.get('/v1/axis-registry', ListAxisRegistryRoute);
openapi.get('/v1/stats', ListStatsRoute);
openapi.get('/v1/stats/:id', GetFontStatsRoute);
openapi.get('/v1/version/:id', GetFontVersionsRoute);

openapi.get('/fonts/:tag/:file', GetBinaryAssetRoute);
openapi.get('/css/:tag/:file', GetCssFileRoute);

openapi.get('/v1/download/:id', DownloadFontRoute);
openapi.get('/v1/fonts/:id/:file', LegacyFontFileRedirectRoute);

app.notFound((c) =>
	c.json(
		{
			status: 404,
			error: DEFAULT_NOT_FOUND_MESSAGE,
		},
		404,
	),
);

app.onError(async (error, c) => {
	if (!(error instanceof HTTPException) || error.status >= 500) {
		console.error(error);
	}
	return toErrorResponse(c, error);
});

export { app };
