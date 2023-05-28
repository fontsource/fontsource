import { isFontsQueries } from './types';
import { error, json } from 'itty-router';
import { getOrUpdateArrayMetadata } from './get';

export const getFonts = async (url: URL, env: Env) => {
	const data = await getOrUpdateArrayMetadata(env);

	// If no query string, return the entire list
	if (url.searchParams.toString().length === 0) {
		return json(data);
	}

	// Filter the results from given queries
	const queries = url.searchParams.entries();
	let queryDoesNotExist = false;
	let filtered = data;

	for (const [key, value] of queries) {
		// Type guard
		if (!isFontsQueries(key)) {
			queryDoesNotExist = true;
			break;
		}

		// Multiple values may be comma separated
		const values = value.split(',');

		// Filter the results
		filtered = filtered.filter((item) => {
			if (key === 'subsets' || key === 'styles') {
				return values.some((v) => item[key].includes(v));
			}

			if (key === 'weights') {
				return values.some((v) => item[key].includes(Number(v)));
			}

			// Coerce to string for boolean responses (variable)
			return values.some((v) => String(item[key]) === v);
		});
	}

	// If query does not exist, return 400
	if (queryDoesNotExist) {
		return error(400, 'Bad Request. Invalid query parameter.');
	}

	// Return the filtered results
	return json(filtered);
};
