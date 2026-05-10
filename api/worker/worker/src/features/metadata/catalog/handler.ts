import type { Context } from 'hono';
import type {
	FontFilterQueryKey,
	FontListQueryKey,
} from '../../../../../shared/catalog';
import { UPSTREAM_URLS } from '../../../constants';
import type { AppEnv } from '../../../env';
import { toHttpDate } from '../../../utils/cache';
import { badRequest, notFound } from '../../../utils/errors';
import { buildFontDetail, filterFontIndex } from '../catalog-views';
import { getFontById, getFontIndex, getFontlist } from '../store';

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

const assertAllowedQueryKeys = <Key extends string>(
	queries: QueryMap,
	allowedKeys: ReadonlySet<Key>,
): void => {
	for (const key of Object.keys(queries)) {
		if (!allowedKeys.has(key as Key)) {
			throw badRequest('Bad Request. Invalid query parameter.');
		}
	}
};

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
	assertAllowedQueryKeys(queries, allowedKeys);

	const keys = Object.keys(queries) as Key[];
	const queryCount = Object.values(queries).reduce(
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
 * Lists one projected field from the catalog via `/fontlist`.
 *
 * The old metadata API only accepted one query key at a time, so this keeps
 * that response contract intact.
 */
export const listFontValues = async (c: Context<AppEnv>): Promise<Response> => {
	// The old `/fontlist` route defaults to `type` when no query parameter is
	// supplied.
	const key = getSingleQueryKey(c.req.queries(), FONTLIST_QUERY_KEYS, 'type');

	return c.json(await getFontlist(c, key), 200);
};

/**
 * Lists fonts from the catalog filtering endpoint.
 */
export const listFonts = async (c: Context<AppEnv>): Promise<Response> => {
	const queries = c.req.queries();
	assertAllowedQueryKeys(queries, FONT_FILTER_QUERY_KEYS);

	let index = await getFontIndex(c);
	for (const key of FONT_FILTER_QUERY_KEYS) {
		for (const value of queries[key] ?? []) {
			index = filterFontIndex(index, key, value);
		}
	}

	return c.json(index, 200);
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
		buildFontDetail(
			font,
			({ id: fontId, subset, weight, style, extension }) =>
				`${UPSTREAM_URLS.publicCdn}/fonts/${fontId}@latest/${subset}-${weight}-${style}.${extension}`,
		),
		200,
		lastModified ? { 'Last-Modified': lastModified } : {},
	);
};
