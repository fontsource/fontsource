import {
	error,
	type IRequestStrict,
	json,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import type { CFRouterContext } from '../types';
import { API_BROWSER_TTL, CF_EDGE_TTL } from '../utils';
import { getAxisRegistry, getVariableId, getVariableList } from './get';
import { type AxisRegistry, isAxisRegistryQuery } from './types';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/v1/variable', async (request, env, ctx) => {
	const { url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	const variableList = await getVariableList(env, ctx);
	if (!variableList) {
		throw new StatusError(500, 'Internal Server Error. Variable list empty.');
	}

	response = json(variableList, {
		headers: {
			'Cache-Control': `public, max-age=${API_BROWSER_TTL}`,
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
			'Content-Type': 'application/json',
		},
	});

	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

router.get('/v1/variable/:id', withParams, async (request, env, ctx) => {
	const { id, url } = request;

	// Check cache first
	const cacheKey = new Request(url.toString(), request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	const variableId = await getVariableId(id, env, ctx);
	if (!variableId) {
		throw new StatusError(
			404,
			`Not Found. Variable metadata for ${id} not found.`,
		);
	}

	response = json(variableId, {
		headers: {
			'Cache-Control': `public, max-age=${API_BROWSER_TTL}`,
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
			'Content-Type': 'application/json',
		},
	});

	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

router.get('/v1/axis-registry', async (request, env, ctx) => {
	const url = new URL(request.url);

	// Check cache first
	const cacheKey = new Request(url.toString(), request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	const registry = await getAxisRegistry(env, ctx);
	if (!registry) {
		throw new StatusError(500, 'Internal Server Error. Axis registry empty.');
	}

	const headers = {
		'Cache-Control': `public, max-age=${API_BROWSER_TTL}`,
		'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
		'Content-Type': 'application/json',
	};

	// If no query string, return the entire list
	if (url.searchParams.toString().length === 0) {
		response = json(registry, { headers });
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	const queries = url.searchParams.entries();
	const filtered: AxisRegistry = {};

	for (const [key, value] of queries) {
		// Type guard
		if (!isAxisRegistryQuery(key)) {
			throw new StatusError(400, 'Bad Request. Invalid query parameter.');
		}

		// Multiple values may be comma separated
		const values = value.split(',');
		for (const [tag, axisItem] of Object.entries(registry)) {
			// Filter the results
			if (key === 'tag' && values.some((v) => tag === v.toUpperCase())) {
				filtered[tag] = registry[tag];
			}

			if (
				key === 'name' &&
				values.some((v) => axisItem.name.toLowerCase() === v.toLowerCase())
			) {
				filtered[tag] = registry[tag];
			}
		}
	}

	if (Object.keys(filtered).length === 0) {
		throw new StatusError(404, 'Not Found. No matching axis found.');
	}

	response = json(filtered, { headers });
	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
