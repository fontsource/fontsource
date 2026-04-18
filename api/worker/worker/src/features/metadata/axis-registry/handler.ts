import type { Context } from 'hono';

import type { AppEnv } from '../../../env';
import { notFound } from '../../../utils/errors';
import { getAxisRegistry } from '../store';

type QueryMap = Record<string, string[]>;

/**
 * Filters query params to the allowed keys and normalises values by splitting
 * on commas and stripping empty strings. This lets callers pass either repeated
 * params (`?tag=WGHT&tag=OPSZ`) or a comma-separated list (`?tag=WGHT,OPSZ`).
 */
const normalizeQueryValues = <Key extends string>(
	queries: QueryMap,
	allowedKeys: ReadonlySet<Key>,
): Partial<Record<Key, string[]>> =>
	Object.fromEntries(
		Object.entries(queries)
			.filter(([key]) => allowedKeys.has(key as Key))
			.map(([key, values]) => [
				key,
				values.flatMap((value) => value.split(',')).filter(Boolean),
			]),
	) as Partial<Record<Key, string[]>>;

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
