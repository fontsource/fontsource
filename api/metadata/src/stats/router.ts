import {
	error,
	type IRequestStrict,
	json,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import { getId } from '../fonts/get';
import type { CFRouterContext } from '../types';
import { API_BROWSER_TTL, CF_EDGE_TTL } from '../utils';
import { getPackageStat, getPackageStatAll, getVersion } from './get';

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

	const metadata = await getId(id, env, ctx);
	if (!metadata) {
		throw new StatusError(404, 'Not found. Font does not exist.');
	}

	const versions = await getVersion(id, metadata.variable, env, ctx);
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

router.get('/v1/stats', async (request, env, ctx) => {
	const url = new URL(request.url);

	// Check cache first
	const cacheKey = new Request(url.toString(), request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	const headers = {
		'Cache-Control': `public, max-age=${API_BROWSER_TTL}`,
		'CDN-Cache-Control': `max-age=${CF_EDGE_TTL}`,
	};
	const data = await getPackageStatAll(env, ctx);

	response = json(data, {
		headers,
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

	// Check if font exists
	const metadata = await getId(id, env, ctx);
	if (!metadata) {
		throw new StatusError(404, 'Not found. Font does not exist.');
	}

	let stats = await getPackageStat(id, env, ctx);
	if (!stats) {
		stats = {
			total: {
				npmDownloadMonthly: 0,
				npmDownloadTotal: 0,
				jsDelivrHitsMonthly: 0,
				jsDelivrHitsTotal: 0,
			},
			static: {
				npmDownloadMonthly: 0,
				npmDownloadTotal: 0,
				jsDelivrHitsMonthly: 0,
				jsDelivrHitsTotal: 0,
			},
			variable: metadata.variable
				? {
						npmDownloadMonthly: 0,
						npmDownloadTotal: 0,
						jsDelivrHitsMonthly: 0,
						jsDelivrHitsTotal: 0,
				  }
				: undefined,
		};
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
