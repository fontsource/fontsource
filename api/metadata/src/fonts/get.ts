import { getMetadata } from '../fontlist/get';
import { KV_TTL, METADATA_KEYS } from '../utils';
import type { ArrayMetadata } from './types';
import { updateArrayMetadata } from './update';

const getArrayMetadata = async (env: Env, ctx: ExecutionContext) => {
	const value = await env.METADATA.get<ArrayMetadata>(METADATA_KEYS.fonts_arr, {
		type: 'json',
		cacheTtl: KV_TTL,
	});

	if (!value) {
		return await updateArrayMetadata(env, ctx);
	}

	return value;
};

const getId = async (id: string, env: Env, ctx: ExecutionContext) => {
	const data = await getMetadata(env, ctx);
	if (!data[id]) {
		return;
	}

	return data[id];
};

export { getArrayMetadata, getId };
