import { KV_TTL, METADATA_KEYS } from '../utils';
import type { Fontlist, FontlistQueries, MetadataList } from './types';
import { updateList, updateMetadata } from './update';

const getMetadata = async (
	env: Env,
	ctx: ExecutionContext,
): Promise<MetadataList> => {
	const value = await env.METADATA.get<MetadataList>(METADATA_KEYS.fonts, {
		type: 'json',
		cacheTtl: KV_TTL,
	});

	if (!value) {
		return await updateMetadata(env, ctx);
	}

	return value;
};

const getList = async (
	key: FontlistQueries,
	env: Env,
	ctx: ExecutionContext,
): Promise<Fontlist> => {
	const value = await env.METADATA.get<Fontlist>(METADATA_KEYS.fontlist(key), {
		type: 'json',
		cacheTtl: KV_TTL,
	});

	if (!value) {
		return await updateList(key, env, ctx);
	}

	return value;
};

export { getList, getMetadata };
