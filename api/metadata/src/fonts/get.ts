import type { ArrayMetadata, IDResponse } from './types';
import { updateArrayMetadata, updateId } from './update';

const getOrUpdateArrayMetadata = async (env: Env, ctx: ExecutionContext) => {
	const value = await env.FONTLIST.get<ArrayMetadata>('metadata_arr', {
		type: 'json',
	});

	if (!value) {
		return await updateArrayMetadata(env, ctx);
	}

	return value;
};

const getOrUpdateId = async (id: string, env: Env, ctx: ExecutionContext) => {
	const value = await env.FONTS.get<IDResponse>(id, { type: 'json' });

	if (!value) {
		return await updateId(id, env, ctx);
	}

	return value;
};

export { getOrUpdateArrayMetadata, getOrUpdateId };
