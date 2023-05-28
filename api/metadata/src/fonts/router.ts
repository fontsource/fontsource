import { Router, IRequestStrict, error, json, withParams } from 'itty-router';
import { CFRouterContext } from '../types';

import { getOrUpdateArrayMetadata, getOrUpdateId } from './get';
import { isFontsQueries } from './types';

interface FontRequest extends IRequestStrict {
	font: string;
}

const router = Router<FontRequest, CFRouterContext>();

router.get('/v1/fonts', async (request, env, _ctx) => {
	const url = new URL(request.url);
	const data = await getOrUpdateArrayMetadata(env);

	// If no query string, return the entire list
	if (url.searchParams.toString().length === 0) {
		return json(data);
	}

	// Filter the results from given queries
	const queries = url.searchParams.entries();
	let queryDoesNotExist = false;
	let filtered = data;

	for (const [key, value] of queries) {
		// Type guard
		if (!isFontsQueries(key)) {
			queryDoesNotExist = true;
			break;
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
			return values.some((v) => String(item[key]) === v);
		});
	}

	// If query does not exist, return 400
	if (queryDoesNotExist) {
		return error(400, 'Bad Request. Invalid query parameter.');
	}

	// Return the filtered results
	return json(filtered);
});

router.get('/v1/fonts/:font', withParams, async (request, env, _ctx) => {
	const id = request.font;

	const data = await getOrUpdateId(id, env);
	if (!data) {
		return error(404, 'Not Found. Font does not exist.');
	}

	return json(data);
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api'
	)
);

export default router;
