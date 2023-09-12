import { getMetadata, splitTag } from 'common-api/util';
import { error, type IRequestStrict, Router, withParams } from 'itty-router';

import type { CFRouterContext } from './types';
import { downloadFile, isAcceptedExtension } from './util';

interface CDNRequest extends IRequestStrict {
	id: string;
	file: string;
}

const router = Router<CDNRequest, CFRouterContext>();

router.get('/fonts/:id/:file', withParams, async (request, env, ctx) => {
	const { id, file, url } = request;

	// Check CF cache
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) return response;

	// Read version metadata from url
	const { id: fontId, version } = await splitTag(id);
	const extension = file.split('.').pop();
	if (!extension || !isAcceptedExtension(extension)) {
		return error(400, 'Bad Request. Invalid file extension.');
	}

	// Check R2 bucket for file
	let item = await env.BUCKET.get(`${id}/${file}`);
	if (item !== null) {
		// If version is a specific version e.g. @3.1.1, give maximum cache, else give 1 day
		const cacheControl =
			version.split('.').length === 3
				? 'public, max-age=31536000, immutable'
				: 'public, max-age=86400';

		// Cache file
		const blob = await item.arrayBuffer();
		response = new Response(blob, {
			status: 200,
			headers: {
				'Cache-Control': cacheControl,
				'Content-Type': `font/${extension}`,
			},
		});
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	// Else query metadata for existence check
	const metadata = await getMetadata(fontId, request.clone(), env);
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	await downloadFile(fontId, version, file, request.clone(), env);

	// Check R2 bucket for file
	item = await env.BUCKET.get(`${id}/${file}`);
	if (item !== null) {
		// If version is a specific version e.g. @3.1.1, give maximum cache, else give 1 day
		const cacheControl =
			version.split('.').length === 3
				? 'public, max-age=31536000, immutable'
				: 'public, max-age=86400';

		// Cache file
		const blob = await item.arrayBuffer();
		response = new Response(blob, {
			status: 200,
			headers: {
				'Cache-Control': cacheControl,
				'Content-Type': `font/${extension}`,
			},
		});
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	// If file does not exist, return 404
	return error(404, 'Not Found. File does not exist.');
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
