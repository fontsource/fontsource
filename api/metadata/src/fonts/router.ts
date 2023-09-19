import {
	error,
	type IRequestStrict,
	json,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import { type CFRouterContext } from '../types';
import { CF_EDGE_TTL } from '../utils';
import { getOrUpdateArrayMetadata, getOrUpdateId } from './get';
import { isFontsQueries } from './types';

interface FontRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<FontRequest, CFRouterContext>();

router.get('/v1/fonts', async (request, env, ctx) => {
	const url = new URL(request.url);

	// Check cache first
	const cacheKey = new Request(url.toString(), request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	const headers = {
		'CDN-Cache-Control': `max-age=${CF_EDGE_TTL}`,
	};
	const data = await getOrUpdateArrayMetadata(env, ctx);

	// If no query string, return the entire list
	if (url.searchParams.toString().length === 0) {
		response = json(data, {
			headers,
		});

		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	// Filter the results from given queries
	const queries = url.searchParams.entries();
	let filtered = data;

	for (const [key, value] of queries) {
		// Type guard
		if (!isFontsQueries(key)) {
			throw new StatusError(400, 'Bad Request. Invalid query parameter.');
		}

		// Multiple values may be comma separated
		const values = value.split(',');

		// Filter the results
		filtered = filtered.filter((item) => {
			if (key === 'subsets' || key === 'styles') {
				return values.some((v) => item[key].includes(v));
			}

			if (key === 'weights') {
				return values.some((v) => item[key].includes(Number(v)));
			}

			// Coerce to string for boolean responses (variable)
			return values.includes(String(item[key]));
		});
	}

	// Return the filtered results
	response = json(filtered, {
		headers,
	});

	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

router.get('/v1/fonts/:id', withParams, async (request, env, ctx) => {
	const { id, url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		console.log('hit');
		return response;
	}

	const data = await getOrUpdateId(id, env, ctx);
	if (!data) {
		return error(404, 'Not Found. Font does not exist.');
	}

	response = json(data, {
		headers: {
			'CDN-Cache-Control': `max-age=${CF_EDGE_TTL}`,
		},
	});

	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

// This is a deprecated route, but we need to keep it for backwards compatibility
router.get('/v1/fonts/:id/:file', withParams, async (request, _env, ctx) => {
	const { id, file, url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	// Fetch from cdn worker
	response = await fetch(
		`https://r2.fontsource.org/fonts/${id}@latest/${file}`,
	);

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
