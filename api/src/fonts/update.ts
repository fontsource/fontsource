import { FontsourceMetadata } from '../types';
import { METADATA_URL } from '../utils';
import { ArrayMetadata } from './types';

// This updates the main array of fonts dataset
const updateBase = async (env: Env) => {
	const response = await fetch(METADATA_URL);
	const data = await response.json<FontsourceMetadata>();

	// Save entire metadata into KV first
	await env.FONTLIST.put('metadata', JSON.stringify(data));

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

export { updateBase };
