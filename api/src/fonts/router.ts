import { Router, IRequestStrict } from 'itty-router';
import { CFRouterContext } from '../types';
import { updateBase } from './update';
import { ArrayMetadata, isFontsQueries } from './types';

const router = Router<IRequestStrict, CFRouterContext>();

router.get('/v1/fonts', async (request, env, _ctx) => {
	const url = new URL(request.url);

	// Get or update the list
	let data = await env.FONTLIST.get<ArrayMetadata>('metadata_arr', {
		type: 'json',
	});
	if (!data) {
		data = await updateBase(env);
	}

	// If no query string, return the entire list
	if (url.searchParams.toString().length === 0) {
		return new Response(JSON.stringify(data), {
			headers: {
				'content-type': 'application/json;charset=UTF-8',
			},
		});
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
		return new Response('Bad Request. Invalid query parameter.', {
			status: 400,
		});
	}

	// Return the filtered results
	return new Response(JSON.stringify(filtered), {
		headers: {
			'content-type': 'application/json;charset=UTF-8',
		},
	});
});

router.get('/v1/fonts/:font', async (request, env, ctx) => {
	const url = new URL(request.url);

	return new Response(
		`Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api`,
		{ status: 404 }
	);
});

// 404 for everything else
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default router;
