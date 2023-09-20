import {
	error,
	type IRequestStrict,
	json,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import { getOrUpdateId } from '../fonts/get';
import type { CFRouterContext } from '../types';
import { API_BROWSER_TTL, CF_EDGE_TTL } from '../utils';
import { getOrUpdatePackageStat, getOrUpdateVersion } from './get';

interface StatsRequest extends IRequestStrict {
	id: string;
}

const router = Router<StatsRequest, CFRouterContext>();

router.get('/v1/version/:id', withParams, async (request, env, ctx) => {
	const { id, url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	const metadata = await getOrUpdateId(id, env, ctx);
	if (!metadata) {
		throw new StatusError(404, 'Not found. Font does not exist.');
	}

	const versions = await getOrUpdateVersion(id, metadata.variable, env, ctx);
	if (!versions) {
		throw new StatusError(500, 'Internal Server Error. Version list empty.');
	}

	response = json(versions, {
		headers: {
			'Cache-Control': `public, max-age=${API_BROWSER_TTL}`,
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
		},
	});

	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
});

router.get('/v1/stats/:id', withParams, async (request, env, ctx) => {
	const { id, url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	const stats = await getOrUpdatePackageStat(id, env, ctx);
	if (!stats) {
		throw new StatusError(500, 'Internal Server Error. Stats list empty.');
	}

	response = json(stats, {
		headers: {
			'Cache-Control': `public, max-age=${API_BROWSER_TTL}`,
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
		},
	});

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
