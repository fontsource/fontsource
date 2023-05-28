import { updateList, updateMetadata } from './update';
import { Fontlist, FontlistQueries } from './types';
import { FontsourceMetadata } from '../types';

const getOrUpdateMetadata = async (env: Env): Promise<FontsourceMetadata> => {
	const value = await env.FONTLIST.get<FontsourceMetadata>('metadata', {
		type: 'json',
	});

	if (!value) {
		return await updateMetadata(env);
	}

	return value;
};

const getOrUpdateList = async (
	key: FontlistQueries,
	env: Env
): Promise<Fontlist> => {
	let value = await env.FONTLIST.get<Fontlist>(key, { type: 'json' });

	if (!value) {
		value = await updateList(key, env);
	}

	return value;
};

export { getOrUpdateList, getOrUpdateMetadata };
