import { getMetadata, splitTagCF } from 'common-api/util';
import { error, type IRequestStrict, Router, withParams } from 'itty-router';

import type { CFRouterContext } from './types';
import { getOrUpdateFile, getOrUpdateZip, isAcceptedExtension } from './util';

interface CDNRequest extends IRequestStrict {
	tag: string;
	file: string;
}

const router = Router<CDNRequest, CFRouterContext>();

router.get('/fonts/:tag/:file', withParams, async (request, env, _ctx) => {
	const { tag, file } = request;

	// Read version metadata from url
	const { id, version } = await splitTagCF(tag);
	const extension = file.split('.').pop();
	if (!extension || !isAcceptedExtension(extension)) {
		return error(400, 'Bad Request. Invalid file extension.');
	}

	const isZip = extension === 'zip';
	// If version is a specific version e.g. @3.1.1, give maximum cache, else give 1 day
	const cacheControl =
		version.split('.').length === 3
			? 'public, max-age=31536000, immutable'
			: 'public, max-age=86400';

	const headers = {
		'Cache-Control': cacheControl,
		'Content-Type': isZip ? 'application/zip' : `font/${extension}`,
		'Content-Disposition': `attachment; filename="${
			isZip ? `${id}_${version}.zip` : `${id}_${version}_${file}`
		}"`,
	};

	// Check R2 bucket for file
	let item = await env.BUCKET.get(`${tag}/${file}`);
	if (item !== null) {
		const blob = await item.arrayBuffer();
		const response = new Response(blob, {
			status: 200,
			headers,
		});
		return response;
	}

	// Else query metadata for existence check
	const metadata = await getMetadata(id);
	if (!metadata) {
		return error(404, 'Not Found. Font does not exist.');
	}

	isZip
		? await getOrUpdateZip(tag, env)
		: await getOrUpdateFile(tag, file, env);

	// Check R2 bucket for file
	item = await env.BUCKET.get(`${id}/${file}`);
	if (item !== null) {
		const blob = await item.arrayBuffer();
		const response = new Response(blob, {
			status: 200,
			headers,
		});
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
