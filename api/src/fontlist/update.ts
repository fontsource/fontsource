import type { Fontlist, FontlistQueries } from './types';
import type { FontsourceMetadata } from '../types';
import { METADATA_URL } from '../utils';

// This updates the fontlist dataset for a given key
const updateList = async (key: FontlistQueries, env: Env) => {
	const response = await fetch(METADATA_URL);
	const data = await response.json<FontsourceMetadata>();

	// Depending on key, generate a fontlist object with respective values
	const list: Fontlist = {};

	for (const value of Object.values(data)) {
		if (key === 'variable') {
			list[value.id] = value.variable ? true : false;
		} else {
			list[value.id] = value[key];
		}
	}

	// Store the list in KV
	await env.FONTLIST.put(key, JSON.stringify(list));
	return list;
};

export { updateList };
