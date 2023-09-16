import { getVersion } from 'common-api/util';
import {
	error,
	type IRequestStrict,
	json,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import { getOrUpdateFile } from '../download/get';
import { type CFRouterContext } from '../types';
import { getOrUpdateArrayMetadata, getOrUpdateId } from './get';
import { isFontsQueries } from './types';

interface FontRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<FontRequest, CFRouterContext>();

router.get('/v1/fonts', async (request, env, ctx) => {
	const url = new URL(request.url);
	const data = await getOrUpdateArrayMetadata(env, ctx);

	// If no query string, return the entire list
	if (url.searchParams.toString().length === 0) {
		return json(data);
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
	return json(filtered);
});

router.get('/v1/fonts/:id', withParams, async (request, env, ctx) => {
	const { id } = request;

	const data = await getOrUpdateId(id, env, ctx);
	if (!data) {
		return error(404, 'Not Found. Font does not exist.');
	}

	return json(data);
});

// This is a deprecated route, but we need to keep it for backwards compatibility
router.get('/v1/fonts/:id/:file', withParams, async (request, env, _ctx) => {
	const { id, file } = request;

	const version = await getVersion(id, 'latest');
	const tag = `${id}@${version}`;

	// Get from bucket directly
	const font = await getOrUpdateFile(tag, file, env);
	if (!font) {
		return error(404, 'Not Found. Font file does not exist.');
	}

	// Return appropriate content type
	if (file.endsWith('.woff2')) {
		return new Response(font.body, {
			headers: {
				'Content-Type': 'font/woff2',
			},
		});
	}

	if (file.endsWith('.woff')) {
		return new Response(font.body, {
			headers: {
				'Content-Type': 'font/woff',
			},
		});
	}

	if (file.endsWith('.ttf')) {
		return new Response(font.body, {
			headers: {
				'Content-Type': 'font/ttf',
			},
		});
	}

	if (file.endsWith('.otf')) {
		return new Response(font.body, {
			headers: {
				'Content-Type': 'font/otf',
			},
		});
	}

	return error(400, 'Bad Request. Invalid file type.');
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
