import { CFRouterContext } from '../types';
import { IRequestStrict, Router } from 'itty-router';
import { updateList } from './update';
import { Fontlist, FontlistQueries, isFontlistQuery } from './types';

const router = Router<IRequestStrict, CFRouterContext>();

const getOrUpdate = async (
	key: FontlistQueries,
	env: Env
): Promise<Fontlist> => {
	let value = await env.FONTLIST.get<Fontlist>(key, { type: 'json' });

	if (!value) {
		value = await updateList(key, env);
	}

	return value;
};

router.get('/fontlist', async (request, env, _ctx) => {
	const url = new URL(request.url);
	const queryString = url.searchParams.toString();

	// If there is more than 2 query strings, then return 400
	if (queryString.split('&').length >= 2) {
		return new Response('Bad Request. You can only use one query parameter.', {
			status: 400,
		});
	}

	// If there is no query string, then return the type list
	let list: Fontlist | undefined;
	if (queryString.length === 0) {
		list = await getOrUpdate('type', env);
	}

	// If there is a query string, then return the respective list
	if (queryString.length > 0) {
		// Get query string key
		const query = url.searchParams.keys().next().value;

		// Type guard
		if (!isFontlistQuery(query)) {
			return new Response('Bad Request. Invalid query parameter.', {
				status: 400,
			});
		}

		// Get or update the list
		list = await getOrUpdate(query, env);
	}

	if (!list) {
		return new Response('Internal server error.', { status: 500 });
	}

	return new Response(JSON.stringify(list), {
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
	});
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
