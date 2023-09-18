import { error, type IRequestStrict, Router, withParams } from 'itty-router';

import type { CFRouterContext, TTLMetadata } from '../types';
import { CF_EDGE_TTL } from '../utils';
import {
	type AxisRegistry,
	type VariableList,
	type VariableMetadataWithVariants,
} from './types';
import {
	updateAxisRegistry,
	updateVariable,
	updateVariableList,
} from './update';

interface DownloadRequest extends IRequestStrict {
	id: string;
}

const router = Router<DownloadRequest, CFRouterContext>();

router.get('/v1/variable', async (_request, env, ctx) => {
	const kv = await env.VARIABLE_LIST.getWithMetadata<VariableList, TTLMetadata>(
		'metadata',
		{
			type: 'json',
		},
	);

	let { value, metadata } = kv;
	if (!value) {
		value = await updateVariableList(env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateVariableList(env, ctx));
	}

	return new Response(JSON.stringify(value), {
		headers: {
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
			'Content-Type': 'application/json',
		},
	});
});

router.get('/v1/variable/:id', withParams, async (request, env, ctx) => {
	const { id } = request;

	const kv = await env.VARIABLE.getWithMetadata<
		VariableMetadataWithVariants,
		TTLMetadata
	>(id, {
		type: 'json',
	});

	let { value, metadata } = kv;
	if (!value) {
		value = await updateVariable(id, env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateVariable(id, env, ctx));
	}

	return new Response(JSON.stringify(value), {
		headers: {
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
			'Content-Type': 'application/json',
		},
	});
});

router.get('/v1/axis-registry', async (_request, env, ctx) => {
	const kv = await env.VARIABLE_LIST.getWithMetadata<AxisRegistry, TTLMetadata>(
		'axis_registry',
		{
			type: 'json',
		},
	);

	let { value, metadata } = kv;
	if (!value) {
		value = await updateAxisRegistry(env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateAxisRegistry(env, ctx));
	}

	return new Response(JSON.stringify(value), {
		headers: {
			'CDN-Cache-Control': `public, max-age=${CF_EDGE_TTL}`,
			'Content-Type': 'application/json',
		},
	});
});

// 404 for everything else
router.all('*', () =>
	error(
		404,
		'Not Found. Please refer to the Fontsource API documentation: https://fontsource.org/docs/api',
	),
);

export default router;
