import type { FontsourceMetadata, TTLMetadata } from '../types';
import type { Fontlist, FontlistQueries } from './types';
import { updateList, updateMetadata } from './update';

const getOrUpdateMetadata = async (
	env: Env,
	ctx: ExecutionContext,
): Promise<FontsourceMetadata> => {
	const { value, metadata } = await env.FONTLIST.getWithMetadata<
		FontsourceMetadata,
		TTLMetadata
	>('metadata', {
		type: 'json',
	});

	if (!value) {
		return await updateMetadata(env);
	}

	// If the ttl is not set or the cache expiry is less than the current time, then return old value
	// while revalidating the cache
	if (!metadata?.ttl || metadata.ttl < Date.now() / 1000) {
		ctx.waitUntil(updateMetadata(env));
	}

	return value;
};

const getOrUpdateList = async (
	key: FontlistQueries,
	env: Env,
	ctx: ExecutionContext,
): Promise<Fontlist> => {
	const { value, metadata } = await env.FONTLIST.getWithMetadata<
		Fontlist,
		TTLMetadata
	>(key, {
		type: 'json',
	});

	if (!value) {
		return await updateList(key, env);
	}

	if (!metadata?.ttl || metadata.ttl < Date.now() / 1000) {
		ctx.waitUntil(updateList(key, env));
	}

	return value;
};

export { getOrUpdateList, getOrUpdateMetadata };
