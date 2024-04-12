import { getMetadata, getVariableMetadata } from 'common-api/util';
import {
	createCors,
	error,
	type IRequestStrict,
	Router,
	StatusError,
	withParams,
} from 'itty-router';

import { updateCss, updateVariableCSS } from './css';
import type { CFRouterContext, TTLMetadata } from './types';
import { updateFile, updateVariableFile, updateZip } from './update';
import { splitTag } from './util';
import {
	validateCSSFilename,
	validateFontFilename,
	validateVariableFontFileName,
	validateVCSSFilename,
} from './validate';

interface CDNRequest extends IRequestStrict {
	tag: string;
	file: string;
}

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
const STALE_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

export const { preflight, corsify } = createCors();

const router = Router<CDNRequest, CFRouterContext>();

router.all('*', preflight);

router.get('/fonts/:tag/:file', withParams, async (request, env, ctx) => {
	const { tag, file, url } = request;

	// Check cache first
	const cacheKey = new Request(url, request.clone());
	const cache = caches.default;

	let response = await cache.match(cacheKey);
	if (response) {
		return response;
	}

	// Read version metadata from url
	const { id, version, isVariable } = await splitTag(tag, request.clone(), env);
	const fullTag = `${id}@${version}`;

	const [, extension] = file.split('.');
	const isZip = extension === 'zip';

	if (isZip && isVariable) {
		throw new StatusError(
			400,
			'Bad Request. Variable fonts cannot be downloaded as a zip.',
		);
	}
	// If version is a specific version e.g. @3.1.1, give maximum cache, else give 1 day
	const tagSplit = tag.split('@')[1];
	const cacheControl =
		tagSplit && tagSplit.split('.').length === 3
			? IMMUTABLE_CACHE
			: STALE_CACHE;

	const headers = new Headers();
	headers.set('Cache-Control', cacheControl);
	headers.set('Content-Type', isZip ? 'application/zip' : `font/${extension}`);
	headers.set(
		'Content-Disposition',
		`attachment; filename="${
			isZip ? `${id}_${version}.zip` : `${id}_${version}_${file}`
		}"`,
	);

	// Check R2 bucket for file
	const key = isVariable ? `${fullTag}/variable/${file}` : `${fullTag}/${file}`;
	let item = await env.FONTS.get(key);
	if (item !== null) {
		headers.set('ETag', item.etag);
		const response = new Response(item.body, {
			status: 200,
			headers,
		});
		ctx.waitUntil(cache.put(cacheKey, response.clone()));
		return response;
	}

	// Else query metadata for existence check
	const [metadata, variableMetadata] = await Promise.all([
		getMetadata(id, request.clone(), env),
		isVariable ? getVariableMetadata(id, request.clone(), env) : undefined,
	]);
	if (!metadata) {
		throw new StatusError(404, 'Not Found. Font does not exist.');
	}
	if (isVariable && !variableMetadata) {
		throw new StatusError(
			404,
			'Not Found. Variable metadata for font does not exist.',
		);
	}

	// Verify file name is valid before hitting download worker
	isVariable
		? validateVariableFontFileName(file, metadata, variableMetadata)
		: validateFontFilename(file, metadata);

	// Fetch file from download worker
	if (isZip) {
		item = await updateZip(fullTag, env);
	} else if (isVariable) {
		item = await updateVariableFile(fullTag, file, env);
	} else {
		item = await updateFile(fullTag, file, env);
	}

	headers.set('ETag', item.etag);
	response = new Response(item.body, {
		status: 200,
		headers,
	});
	ctx.waitUntil(cache.put(cacheKey, response.clone()));
	return response;
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
	const { id, version, isVariable } = await splitTag(tag, request.clone(), env);
	const fullTag = `${id}@${version}`;

	// If version is a specific version e.g. @3.1.1, give maximum cache, else give 1 day
	const tagSplit = tag.split('@')[1];
	const cacheControl =
		tagSplit && tagSplit.split('.').length === 3
			? IMMUTABLE_CACHE
			: STALE_CACHE;

	const headers = new Headers();
	headers.set('Cache-Control', cacheControl);
	headers.set('Content-Type', 'text/css');

	// Check KV for file
	const key = isVariable ? `variable:${fullTag}:${file}` : `${fullTag}:${file}`;

	let { value, metadata } = await env.CSS.getWithMetadata<TTLMetadata>(key);
	if (!value) {
		// Else query metadata for existence check
		const [staticMetadata, variableMetadata] = await Promise.all([
			getMetadata(id, request.clone(), env),
			isVariable ? getVariableMetadata(id, request.clone(), env) : undefined,
		]);
		if (!staticMetadata) {
			throw new StatusError(404, 'Not Found. Font does not exist.');
		}
		if (isVariable && !variableMetadata) {
			throw new StatusError(
				404,
				'Not Found. Variable metadata for font does not exist.',
			);
		}

		// Verify file name is valid before hitting download worker
		if (isVariable && variableMetadata) {
			validateVCSSFilename(file, variableMetadata);
			value = await updateVariableCSS(
				id,
				version,
				file,
				staticMetadata,
				variableMetadata,
				env,
				ctx,
			);
		} else {
			validateCSSFilename(file, staticMetadata);
			value = await updateCss(fullTag, file, staticMetadata, env, ctx);
		}

		if (!value) {
			// If file does not exist, return 404
			throw new StatusError(404, 'Not Found. File does not exist.');
		}
	}

	// If the ttl is not set or the cache expiry is less than the current time, then return old value
	// while revalidating the cache
	if (!metadata?.ttl || metadata.ttl < Date.now() / 1000) {
		// Else query metadata for existence check
		const [staticMetadata, variableMetadata] = await Promise.all([
			getMetadata(id, request.clone(), env),
			isVariable ? getVariableMetadata(id, request.clone(), env) : undefined,
		]);
		if (!staticMetadata) {
			throw new StatusError(404, 'Not Found. Font does not exist.');
		}
		if (isVariable && !variableMetadata) {
			throw new StatusError(
				404,
				'Not Found. Variable metadata for font does not exist.',
			);
		}

		ctx.waitUntil(
			isVariable
				? updateVariableCSS(
						id,
						version,
						file,
						staticMetadata,
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						variableMetadata!,
						env,
						ctx,
				  )
				: updateCss(fullTag, file, staticMetadata, env, ctx),
		);
	}

	response = new Response(value, {
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
