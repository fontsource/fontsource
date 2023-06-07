import type { FontsourceMetadata } from '../types';
import { METADATA_URL } from '../utils';
import type { Fontlist, FontlistQueries } from './types';

const updateMetadata = async (env: Env) => {
	const response = await fetch(METADATA_URL);
	const data = await response.json<FontsourceMetadata>();

	// Save entire metadata into KV first
	await env.FONTLIST.put('metadata', JSON.stringify(data));

	return data;
};

// This updates the fontlist dataset for a given key
const updateList = async (key: FontlistQueries, env: Env) => {
	const response = await fetch(METADATA_URL);
	const data = await response.json<FontsourceMetadata>();

	// Depending on key, generate a fontlist object with respective values
	const list: Fontlist = {};

	for (const value of Object.values(data)) {
		list[value.id] = key === 'variable' ? Boolean(value.variable) : value[key];
	}

	// Store the list in KV
	await env.FONTLIST.put(key, JSON.stringify(list));
	return list;
};

export { updateList, updateMetadata };
