import type { Context } from 'hono';
import { z } from 'zod';
import { CACHE_POLICIES } from '../../constants';
import type { AppEnv } from '../../env';
import { toHttpDate } from '../../utils/cache';
import { badGateway, notFound } from '../../utils/errors';

const CurrentSnapshotSchema = z.strictObject({
	schemaVersion: z.literal(1),
	registryRevision: z.string().regex(/^[0-9a-f]{40}$/),
});

const respondWithObject = (
	object: R2Object | R2ObjectBody,
	contentType: string,
	cachePolicy: HeadersInit,
): Response => {
	const headers = new Headers(cachePolicy);
	headers.set('Content-Type', contentType);
	headers.set('ETag', object.httpEtag);
	const lastModified = toHttpDate(object.uploaded);
	if (lastModified) {
		headers.set('Last-Modified', lastModified);
	}

	if (!('body' in object)) {
		return new Response(null, { status: 304, headers });
	}

	return new Response(object.body, { headers });
};

const getCurrentRevision = async (c: Context<AppEnv>): Promise<string> => {
	const object = await c.env.REGISTRY.get('current.json');
	if (!object) {
		throw badGateway('Bad Gateway. Registry snapshot is unavailable.');
	}

	const current = CurrentSnapshotSchema.safeParse(await object.json());
	if (!current.success) {
		throw badGateway('Bad Gateway. Registry snapshot pointer is invalid.');
	}

	return current.data.registryRevision;
};

export const getRegistryView = async (
	c: Context<AppEnv>,
	path: string,
	notFoundMessage?: string,
): Promise<Response> => {
	const revision = await getCurrentRevision(c);
	const object = await c.env.REGISTRY.get(`snapshots/${revision}/api/${path}`, {
		onlyIf: c.req.raw.headers,
	});
	if (!object) {
		if (notFoundMessage) {
			throw notFound(notFoundMessage);
		}
		throw badGateway('Bad Gateway. Registry snapshot is incomplete.');
	}

	return respondWithObject(
		object,
		'application/json; charset=utf-8',
		CACHE_POLICIES.metadata,
	);
};

export const getRegistrySource = async (
	c: Context<AppEnv>,
	sha256: string,
): Promise<Response> => {
	const object = await c.env.REGISTRY.get(`sources/sha256/${sha256}`, {
		onlyIf: c.req.raw.headers,
	});
	if (!object) {
		throw notFound('Not Found. Registry source does not exist.');
	}

	const contentType = object.httpMetadata?.contentType;
	if (contentType !== 'font/ttf' && contentType !== 'font/otf') {
		throw badGateway('Bad Gateway. Registry source metadata is invalid.');
	}

	return respondWithObject(object, contentType, CACHE_POLICIES.immutable);
};
