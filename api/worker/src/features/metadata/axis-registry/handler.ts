import type { Context } from 'hono';

import type { AppEnv } from '../../../env';
import { badRequest, notFound } from '../../../utils/errors';
import { getAxisRegistry } from '../store';

type QueryMap = Record<string, string[]>;

/**
 * Validates query params against the allowed keys and normalises values by splitting
 * on commas and stripping empty strings. This lets callers pass either repeated
 * params (`?tag=WGHT&tag=OPSZ`) or a comma-separated list (`?tag=WGHT,OPSZ`).
 */
const normalizeQueryValues = <Key extends string>(
	queries: QueryMap,
	allowedKeys: ReadonlySet<Key>,
): Partial<Record<Key, string[]>> => {
	const normalized: Partial<Record<Key, string[]>> = {};

	for (const [key, values] of Object.entries(queries)) {
		if (!allowedKeys.has(key as Key)) {
			throw badRequest('Bad Request. Invalid query parameter.');
		}

		normalized[key as Key] = values
			.flatMap((value) => value.split(','))
			.filter(Boolean);
	}

	return normalized;
};

const AXIS_REGISTRY_QUERY_KEYS = new Set(['name', 'tag'] as const);

/**
 * Lists `/axes`, with optional filtering by axis name or tag.
 */
export const listAxisRegistry = async (
	c: Context<AppEnv>,
): Promise<Response> => {
	const queries = normalizeQueryValues(
		c.req.queries(),
		AXIS_REGISTRY_QUERY_KEYS,
	);
	const tagQueries = queries.tag ?? [];
	const nameQueries = queries.name ?? [];

	if (tagQueries.length === 0 && nameQueries.length === 0) {
		return c.json(await getAxisRegistry(c), 200);
	}

	const registry = await getAxisRegistry(c);
	const tagFilter = new Set(tagQueries.map((query) => query.toUpperCase()));
	const nameFilter = new Set(nameQueries.map((query) => query.toLowerCase()));
	const filtered = Object.fromEntries(
		Object.entries(registry).filter(([tag, axis]) => {
			// The legacy endpoint unions `tag` and `name` matches rather than
			// intersecting them.
			return (
				tagFilter.has(tag.toUpperCase()) ||
				nameFilter.has(axis.name.toLowerCase())
			);
		}),
	) as typeof registry;

	if (Object.keys(filtered).length === 0) {
		throw notFound('Not Found. No matching axis found.');
	}

	return c.json(filtered, 200);
};
