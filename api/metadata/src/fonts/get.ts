import { type TTLMetadata } from '../types';
import type { ArrayMetadata, IDResponse } from './types';
import { updateArrayMetadata, updateId } from './update';

const getOrUpdateArrayMetadata = async (env: Env, ctx: ExecutionContext) => {
	const { value, metadata } = await env.FONTLIST.getWithMetadata<
		ArrayMetadata,
		TTLMetadata
	>('metadata_arr', {
		type: 'json',
	});

	if (!value) {
		return await updateArrayMetadata(env, ctx);
	}

	// If the ttl is not set or the cache expiry is less than the current time, then return old value
	// while revalidating the cache
	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateArrayMetadata(env, ctx));
	}

	return value;
};

const getOrUpdateId = async (id: string, env: Env, ctx: ExecutionContext) => {
	const { value, metadata } = await env.FONTS.getWithMetadata<
		IDResponse,
		TTLMetadata
	>(id, { type: 'json' });

	if (!value) {
		return await updateId(id, env, ctx);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now()) {
		ctx.waitUntil(updateId(id, env, ctx));
	}

	return value;
};

export { getOrUpdateArrayMetadata, getOrUpdateId };
