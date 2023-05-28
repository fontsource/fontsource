import { ArrayMetadata } from './types';
import { updateArrayMetadata } from './update';

const getOrUpdateArrayMetadata = async (env: Env) => {
	const value = await env.FONTLIST.get<ArrayMetadata>('metadata_arr', {
		type: 'json',
	});

	if (!value) {
		return await updateArrayMetadata(env);
	}

	return value;
};

export { getOrUpdateArrayMetadata };
