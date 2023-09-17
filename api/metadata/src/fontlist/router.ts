import { error, type IRequestStrict, json, Router } from 'itty-router';

import type { CFRouterContext } from '../types';
import { CF_EDGE_TTL } from '../utils';
import { getOrUpdateList } from './get';
import { type Fontlist, isFontlistQuery } from './types';

const router = Router<IRequestStrict, CFRouterContext>();

router.get('/fontlist', async (request, env, ctx) => {
	// Get query string
	const url = new URL(request.url);
	const queryString = url.searchParams.toString();

	// If there is more than 2 query strings, then return 400
	if (queryString.split('&').length >= 2) {
		return error(400, 'Bad Request. You can only use one query parameter.');
	}

	// If there is no query string, then return the type list
	let list: Fontlist | undefined;
	if (queryString.length === 0) {
		list = await getOrUpdateList('type', env, ctx);
	}

	// If there is a query string, then return the respective list
	if (queryString.length > 0) {
		// Get query string key
		const query = url.searchParams.keys().next().value;

		// Type guard
		if (!isFontlistQuery(query)) {
			return error(400, 'Bad Request. Invalid query parameter.');
		}

		// Get or update the list
		list = await getOrUpdateList(query, env, ctx);
	}

	if (!list) {
		return error(500, 'Internal server error.');
	}

	return json(list, {
		headers: {
			'CDN-Cache-Control': `max-age=${CF_EDGE_TTL}`,
		},
	});
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
