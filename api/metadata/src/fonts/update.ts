import { getMetadata } from '../fontlist/get';
import { METADATA_KEYS } from '../utils';
import type { ArrayMetadata } from './types';

// This updates the main array of fonts dataset
const updateArrayMetadata = async (env: Env, ctx: ExecutionContext) => {
	const data = await getMetadata(env, ctx);

	// v1 Response
	const list: ArrayMetadata = [];

	for (const value of Object.values(data)) {
		list.push({
			id: value.id,
			family: value.family,
			subsets: value.subsets,
			weights: value.weights,
			styles: value.styles,
			defSubset: value.defSubset,
			variable: value.variable,
			lastModified: value.lastModified,
			category: value.category,
			license: value.license,
			type: value.type,
		});
	}

	// Store the list in KV
	ctx.waitUntil(
		env.METADATA.put(METADATA_KEYS.fonts_arr, JSON.stringify(list)),
	);
	return list;
};

export { updateArrayMetadata };
