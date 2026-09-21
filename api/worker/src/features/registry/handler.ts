import type { Context } from 'hono';
import type { z } from 'zod';
import {
	CurrentRegistrySnapshotSchema,
	REGISTRY_SNAPSHOT_PREFIX,
	RegistrySnapshotIndexSchema,
} from '../../../../shared/registry-archive';
import { CACHE_POLICIES } from '../../constants';
import type { AppEnv } from '../../env';
import { toHttpDate } from '../../utils/cache';
import { badGateway, notFound } from '../../utils/errors';

// Keep only a completed immutable index per bucket; never share request-bound I/O.
const snapshotIndexes = new WeakMap<
	R2Bucket,
	z.infer<typeof RegistrySnapshotIndexSchema>
>();

const respondWithObject = (
	object: R2Object | R2ObjectBody,
	contentType: string,
	cachePolicy: HeadersInit,
	lastModified: string | undefined,
): Response => {
	const headers = new Headers(cachePolicy);
	headers.set('Content-Type', contentType);
	headers.set('ETag', object.httpEtag);
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

	const current = CurrentRegistrySnapshotSchema.safeParse(
		await object.json().catch(() => null),
	);
	if (!current.success) {
		throw badGateway('Bad Gateway. Registry snapshot pointer is invalid.');
	}

	return current.data.registryRevision;
};

const getRegistryViewKey = async (
	c: Context<AppEnv>,
	path: string,
	notFoundMessage?: string,
): Promise<string> => {
	const revision = await getCurrentRevision(c);
	let index = snapshotIndexes.get(c.env.REGISTRY);
	if (index?.registryRevision !== revision) {
		const object = await c.env.REGISTRY.get(
			`${REGISTRY_SNAPSHOT_PREFIX}/${revision}/index.json`,
		);
		if (!object) {
			throw badGateway('Bad Gateway. Registry snapshot index is unavailable.');
		}
		const parsed = RegistrySnapshotIndexSchema.safeParse(
			await object.json().catch(() => null),
		);
		if (!parsed.success || parsed.data.registryRevision !== revision) {
			throw badGateway('Bad Gateway. Registry snapshot index is invalid.');
		}
		index = parsed.data;
		snapshotIndexes.set(c.env.REGISTRY, index);
	}
	const hash = index.views[path];
	if (!hash) {
		if (notFoundMessage) throw notFound(notFoundMessage);
		throw badGateway('Bad Gateway. Registry snapshot is incomplete.');
	}
	return `api/sha256/${hash}`;
};

export const getRegistryView = async (
	c: Context<AppEnv>,
	path: string,
	notFoundMessage?: string,
): Promise<Response> => {
	const key = await getRegistryViewKey(c, path, notFoundMessage);
	// A reused blob's upload date does not describe the current public view.
	const conditions = new Headers(c.req.raw.headers);
	conditions.delete('If-Modified-Since');
	conditions.delete('If-Unmodified-Since');
	const object = await c.env.REGISTRY.get(key, {
		onlyIf: conditions,
	});
	if (!object) {
		throw badGateway('Bad Gateway. Registry snapshot is incomplete.');
	}

	return respondWithObject(
		object,
		'application/json; charset=utf-8',
		CACHE_POLICIES.registry,
		undefined,
	);
};

export const readRegistryView = async <T>(
	c: Context<AppEnv>,
	path: string,
	schema: z.ZodType<T>,
	notFoundMessage?: string,
): Promise<T> => {
	const key = await getRegistryViewKey(c, path, notFoundMessage);
	const object = await c.env.REGISTRY.get(key);
	if (!object) {
		throw badGateway('Bad Gateway. Registry snapshot is incomplete.');
	}

	const parsed = schema.safeParse(await object.json().catch(() => null));
	if (!parsed.success) {
		throw badGateway('Bad Gateway. Registry snapshot view is invalid.');
	}

	return parsed.data;
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

	return respondWithObject(
		object,
		contentType,
		CACHE_POLICIES.immutable,
		toHttpDate(object.uploaded),
	);
};

export const getRegistrySourcePreview = async (
	c: Context<AppEnv>,
	sha256: string,
	file: string,
): Promise<Response> => {
	const object = await c.env.REGISTRY.get(
		`sources/sha256/${sha256}/preview-${file}`,
		{ onlyIf: c.req.raw.headers },
	);
	if (!object) {
		throw notFound('Not Found. Registry source preview does not exist.');
	}
	if (object.httpMetadata?.contentType !== 'font/woff2') {
		throw badGateway(
			'Bad Gateway. Registry source preview metadata is invalid.',
		);
	}
	return respondWithObject(
		object,
		'font/woff2',
		CACHE_POLICIES.immutable,
		toHttpDate(object.uploaded),
	);
};
