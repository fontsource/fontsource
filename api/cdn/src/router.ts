import { getMetadata, splitTag } from 'common-api/util';
import {
	createCors,
	error,
	type IRequestStrict,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import { updateCss } from './css';
import type { CFRouterContext } from './types';
import { updateFile, updateZip } from './update';
import {
	isAcceptedExtension,
	validateCSSFilename,
	validateFontFilename,
} from './util';

interface CDNRequest extends IRequestStrict {
	tag: string;
	file: string;
}

export const { preflight, corsify } = createCors();

const router = Router<CDNRequest, CFRouterContext>();

router.all('*', preflight);

router.get('/fonts/:tag/:file', withParams, async (request, env, ctx) => {
	const { tag, file, url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	const response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	// Read version metadata from url
	const { id, version } = await splitTag(tag, request.clone(), env);
	const fullTag = `${id}@${version}`;
	const [fileName, extension] = file.split('.');
	if (!extension || !isAcceptedExtension(extension)) {
		return error(400, 'Bad Request. Invalid file extension.');
	}

	const isZip = extension === 'zip';
	// If version is a specific version e.g. @3.1.1, give maximum cache, else give 1 day
	const tagSplit = tag.split('@')[1];
	const cacheControl =
		tagSplit && tagSplit.split('.').length === 3
			? 'public, max-age=31536000, immutable'
			: 'public, max-age=86400, stale-while-revalidate=604800';

	const headers = {
		'Cache-Control': cacheControl,
		'Content-Type': isZip ? 'application/zip' : `font/${extension}`,
		'Content-Disposition': `attachment; filename="${
			isZip ? `${id}_${version}.zip` : `${id}_${version}_${file}`
		}"`,
	};

	// Check R2 bucket for file
	let item = await env.FONTS.get(`${fullTag}/${file}`);
	if (item !== null) {
		const blob = await item.arrayBuffer();
		const response = new Response(blob, {
			status: 200,
			headers,
		});
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	// Else query metadata for existence check
	const metadata = await getMetadata(id, request.clone(), env);
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	// Verify file name is valid before hitting download worker
	await validateFontFilename(fileName, metadata, request.clone(), env);

	// Fetch file from download worker
	item = isZip
		? await updateZip(fullTag, env)
		: await updateFile(fullTag, file, env);
	if (item !== null) {
		const blob = await item.arrayBuffer();
		const response = new Response(blob, {
			status: 200,
			headers,
		});
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	// If file does not exist, return 404
	return error(404, 'Not Found. File does not exist.');
});

router.get('/css/:tag/:file', withParams, async (request, env, ctx) => {
	const { tag, file, url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	// Read version metadata from url
	const { id, version } = await splitTag(tag, request.clone(), env);
	const fullTag = `${id}@${version}`;
	const [fileName, extension] = file.split('.');
	if (!extension || extension !== 'css') {
		return error(400, 'Bad Request. Invalid file extension.');
	}

	// If version is a specific version e.g. @3.1.1, give maximum cache, else give 1 day
	const tagSplit = tag.split('@')[1];
	const cacheControl =
		tagSplit && tagSplit.split('.').length === 3
			? // TODO: Replace with immutable once we migrate to jsdelivr proxy
			  'public, max-age=86400, stale-while-revalidate=604800' // 'public, max-age=31536000, immutable'
			: 'public, max-age=86400, stale-while-revalidate=604800';

	const headers = {
		'Cache-Control': cacheControl,
		'Content-Type': 'text/css',
	};

	// Check KV for file
	const key = `${fullTag}_${file}`;

	let item = await env.CSS.get(key);
	if (!item) {
		// Else query metadata for existence check
		const metadata = await getMetadata(id, request.clone(), env);
		if (!metadata) {
			throw new StatusError(404, 'Not Found. Font does not exist.');
		}

		// Verify file name is valid before hitting download worker
		await validateCSSFilename(fileName, metadata, request.clone(), env);

		// Fetch file from download worker
		item = updateCss(fullTag, fileName, metadata);
		if (!item) {
			// If file does not exist, return 404
			throw new StatusError(404, 'Not Found. File does not exist.');
		}

		ctx.waitUntil(env.CSS.put(key, item));
	}

	response = new Response(item, {
		status: 200,
		headers,
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
