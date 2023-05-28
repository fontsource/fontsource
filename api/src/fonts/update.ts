import { getOrUpdateMetadata } from '../fontlist/get';
import { ArrayMetadata } from './types';

// This updates the main array of fonts dataset
const updateArrayMetadata = async (env: Env) => {
	const data = getOrUpdateMetadata(env);

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
			variable: value.variable ? true : false,
			lastModified: value.lastModified,
			category: value.category,
			license: value.license.type,
			type: value.type,
		});
	}

	// Store the list in KV
	await env.FONTLIST.put('metadata_arr', JSON.stringify(list));
	return list;
};

export { updateArrayMetadata };
