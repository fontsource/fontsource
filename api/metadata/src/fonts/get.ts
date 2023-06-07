import type { ArrayMetadata, IDResponse } from './types';
import { updateArrayMetadata, updateId } from './update';

const getOrUpdateArrayMetadata = async (env: Env) => {
	const value = await env.FONTLIST.get<ArrayMetadata>('metadata_arr', {
		type: 'json',
	});

	if (!value) {
		return await updateArrayMetadata(env);
	}

	return value;
};

const getOrUpdateId = async (id: string, env: Env) => {
	const value = await env.FONTS.get<IDResponse>(id, { type: 'json' });

	if (!value) {
		return await updateId(id, env);
	}

	return value;
};

export { getOrUpdateArrayMetadata, getOrUpdateId };
