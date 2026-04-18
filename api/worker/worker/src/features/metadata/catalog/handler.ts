import type { Context } from 'hono';
import type {
	FontFilterQueryKey,
	FontListQueryKey,
} from '../../../../../shared/catalog';
import { UPSTREAM_URLS } from '../../../constants';
import type { AppEnv } from '../../../env';
import { toHttpDate } from '../../../utils/cache';
import { badRequest, notFound } from '../../../utils/errors';
import {
	buildFontDetail,
	buildFontlist,
	filterFontIndex,
} from '../catalog-views';
import { getCatalog, getFontById, getFontIndex } from '../store';

type QueryMap = Record<string, string[]>;

// The exhaustive set of fields the legacy /fontlist endpoint can project over.
// Only one of these may appear as a query parameter in any single request.
const FONTLIST_QUERY_KEYS = new Set<FontListQueryKey>([
	'family',
	'subsets',
	'weights',
	'styles',
	'variable',
	'lastModified',
	'category',
	'version',
	'type',
]);

// Fields that the /v1/fonts filter endpoint accepts. Multiple filters may be
// combined; repeated params for the same key collapse to the last value.
const FONT_FILTER_QUERY_KEYS = new Set<FontFilterQueryKey>([
	'id',
	'family',
	'subsets',
	'weights',
	'styles',
	'defSubset',
	'variable',
	'lastModified',
	'category',
	'license',
	'type',
]);

/**
 * Enforces the legacy /fontlist contract: only one query parameter is allowed
 * per request. Throws 400 if the caller supplied more than one value across
 * all allowed keys, and returns the matched key (or `defaultKey` when no
 * parameter was supplied).
 */
const getSingleQueryKey = <Key extends string>(
	queries: QueryMap,
	allowedKeys: ReadonlySet<Key>,
	defaultKey: Key,
): Key => {
	const filteredQueries = Object.fromEntries(
		Object.entries(queries).filter(([key]) => allowedKeys.has(key as Key)),
	);
	const keys = Object.keys(filteredQueries) as Key[];
	const queryCount = Object.values(filteredQueries).reduce(
		(total, values: string[]) => total + values.length,
		0,
	);

	if (queryCount > 1) {
		throw badRequest('Bad Request. You can only use one query parameter.');
	}

	const key = keys[0] ?? defaultKey;
	return key;
};

/**
 * Collapses each allowed query key to a single string value.
 *
 * The legacy /v1/fonts endpoint was backed by a system that collapsed repeated
 * params to the last occurrence, so this preserves that behaviour: if a client
 * sends `?family=Roboto&family=Open+Sans`, the result is `{ family: "Open Sans" }`.
 */
const collapseQueryValues = <Key extends string>(
	queries: QueryMap,
	allowedKeys: ReadonlySet<Key>,
): Partial<Record<Key, string>> =>
	Object.fromEntries(
		Object.entries(queries)
			.filter(
				([key, values]) => allowedKeys.has(key as Key) && values.length > 0,
			)
			.map(([key, values]) => [key, values.at(-1)]),
	) as Partial<Record<Key, string>>;

/**
 * Lists one projected field from the catalog via `/fontlist`.
 *
 * The old metadata API only accepted one query key at a time, so this keeps
 * that response contract intact.
 */
export const listFontValues = async (c: Context<AppEnv>): Promise<Response> => {
	// The old `/fontlist` route defaults to `type` when no query parameter is
	// supplied.
	const key = getSingleQueryKey(c.req.queries(), FONTLIST_QUERY_KEYS, 'type');
	const catalog = await getCatalog(c);

	return c.json(buildFontlist(catalog, key), 200);
};

/**
 * Lists fonts from the catalog filtering endpoint.
 */
export const listFonts = async (c: Context<AppEnv>): Promise<Response> => {
	// Repeated params collapse to the last value, which matches the old endpoint.
	const queries = collapseQueryValues(c.req.queries(), FONT_FILTER_QUERY_KEYS);
	const index = await getFontIndex(c);

	return c.json(filterFontIndex(index, queries), 200);
};

/**
 * Returns `/fonts/:id`, enriched with public CDN URLs.
 */
export const getFont = async (
	c: Context<AppEnv>,
	id: string,
): Promise<Response> => {
	const font = await getFontById(c, id);
	if (!font) {
		throw notFound('Not Found. Font does not exist.');
	}

	const lastModified = toHttpDate(font.lastModified);

	return c.json(
		buildFontDetail(font, ({ id: fontId, subset, weight, style, extension }) =>
			new URL(
				`fonts/${fontId}@latest/${subset}-${weight}-${style}.${extension}`,
				`${UPSTREAM_URLS.publicCdn}/`,
			).toString(),
		),
		200,
		lastModified ? { 'Last-Modified': lastModified } : {},
	);
};
