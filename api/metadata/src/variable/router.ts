import {
	error,
	type IRequestStrict,
	json,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import type { CFRouterContext } from '../types';
import { CF_EDGE_TTL } from '../utils';
import {
	getOrUpdateAxisRegistry,
	getOrUpdateVariableId,
	getOrUpdateVariableList,
} from './get';
import { type AxisRegistry, isAxisRegistryQuery } from './types';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/v1/variable', async (_request, env, ctx) => {
	const variableList = await getOrUpdateVariableList(env, ctx);

	return json(variableList, {
		headers: {
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
			'Content-Type': 'application/json',
		},
	});
});

router.get('/v1/variable/:id', withParams, async (request, env, ctx) => {
	const { id } = request;
	const variableId = await getOrUpdateVariableId(id, env, ctx);

	return json(variableId, {
		headers: {
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
			'Content-Type': 'application/json',
		},
	});
});

router.get('/v1/axis-registry', async (request, env, ctx) => {
	const url = new URL(request.url);
	const registry = await getOrUpdateAxisRegistry(env, ctx);

	const headers = {
		'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
		'Content-Type': 'application/json',
	};

	// If no query string, return the entire list
	if (url.searchParams.toString().length === 0) {
		return json(registry, { headers });
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

	return json(filtered, { headers });
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
