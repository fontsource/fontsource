import { CFRouterContext } from '../types';
import { IRequestStrict, Router, error, json } from 'itty-router';
import { getOrUpdateList } from './get';
import { Fontlist, isFontlistQuery } from './types';

const router = Router<IRequestStrict, CFRouterContext>();

router.get('/fontlist', async (request, env, _ctx) => {
	const url = new URL(request.url);
	const queryString = url.searchParams.toString();

	// If there is more than 2 query strings, then return 400
	if (queryString.split('&').length >= 2) {
		return error(400, 'Bad Request. You can only use one query parameter.');
	}

	// If there is no query string, then return the type list
	let list: Fontlist | undefined;
	if (queryString.length === 0) {
		list = await getOrUpdateList('type', env);
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
		list = await getOrUpdateList(query, env);
	}

	if (!list) {
		return error(500, 'Internal server error.');
	}

	return json(list);
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
	)
);

export default router;
