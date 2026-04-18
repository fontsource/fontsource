import type { Context } from 'hono';
import type { AxisRegistry } from '../../../../shared/axis-registry';
import type {
	FontCatalog,
	SourceFontMetadata,
	VariableCatalog,
} from '../../../../shared/catalog';
import type { StatsResponse } from '../../../../shared/stats';
import { fetchPackageVersions } from '../../../../shared/upstream';
import {
	DERIVED_METADATA_CACHE_TTL_MS,
	KV_CACHE_TTLS,
	KV_KEYS,
} from '../../constants';
import type { AppEnv } from '../../env';
import { sortPublishedVersionsDesc } from '../font-tag';
import { buildFontIndex, buildVariableIndex } from './catalog-views';
import { refreshAxisRegistry, refreshCatalog, refreshStats } from './refresh';

export interface VersionResponse {
	latest: string;
	static: string[];
	latestVariable?: string;
	variable?: string[];
}

export const buildVersionResponse = (
	staticVersions: readonly string[],
	variableVersions?: readonly string[],
): VersionResponse => {
	const sortedStatic = sortPublishedVersionsDesc(staticVersions);
	const sortedVariable = variableVersions
		? sortPublishedVersionsDesc(variableVersions)
		: undefined;

	return {
		latest: sortedStatic[0] ?? '',
		static: sortedStatic,
		...(sortedVariable && sortedVariable.length > 0
			? {
					latestVariable: sortedVariable[0],
					variable: sortedVariable,
				}
			: {}),
	};
};

const derivedMetadataCache = new Map<
	string,
	{ value: unknown; expiresAt: number }
>();

export const clearMetadataCachesForTest = (): void => {
	derivedMetadataCache.clear();
};

/**
 * Reads a JSON payload from KV and refreshes it from upstream on a cold miss.
 */
const readKvJsonOrRefresh = async <T>(
	c: Context<AppEnv>,
	key: string,
	refresh: (env: AppEnv['Bindings']) => Promise<T>,
): Promise<T> => {
	const cached = await c.env.METADATA.get<T>(key, {
		type: 'json',
		cacheTtl: KV_CACHE_TTLS.metadata,
	});

	return cached ?? (await refresh(c.env));
};

/**
 * Builds a derived catalog view lazily and keeps it in isolate memory.
 *
 * The catalog is the only persisted source of truth; other metadata views are
 * cheap enough to rebuild on demand.
 */
const getDerivedView = async <T>(
	c: Context<AppEnv>,
	cacheKey: string,
	build: (catalog: FontCatalog) => T,
): Promise<T> => {
	const cached = derivedMetadataCache.get(cacheKey);

	if (cached && cached.expiresAt > Date.now()) {
		return cached.value as T;
	}

	const value = build(await getCatalog(c));
	derivedMetadataCache.set(cacheKey, {
		value,
		expiresAt: Date.now() + DERIVED_METADATA_CACHE_TTL_MS,
	});

	return value;
};

/**
 * Returns the normalized catalog, using KV before falling back to an upstream
 * refresh.
 */
export const getCatalog = (c: Context<AppEnv>): Promise<FontCatalog> =>
	readKvJsonOrRefresh(c, KV_KEYS.catalog, refreshCatalog);

/**
 * Returns the flattened catalog view used by filter endpoints.
 */
export const getFontIndex = (
	c: Context<AppEnv>,
): Promise<ReturnType<typeof buildFontIndex>> =>
	getDerivedView(c, 'metadata:font_index', buildFontIndex);

/**
 * Returns the variable-only view derived from the catalog.
 */
export const getVariableCatalog = (
	c: Context<AppEnv>,
): Promise<VariableCatalog> =>
	getDerivedView(c, 'metadata:variable_catalog', buildVariableIndex);

/**
 * Returns the normalized axis registry.
 */
export const getAxisRegistry = (c: Context<AppEnv>): Promise<AxisRegistry> =>
	readKvJsonOrRefresh(c, KV_KEYS.axisRegistry, refreshAxisRegistry);

/**
 * Returns the aggregated per-family statistics payload.
 */
export const getStats = (
	c: Context<AppEnv>,
): Promise<Record<string, StatsResponse>> =>
	readKvJsonOrRefresh(c, KV_KEYS.stats, refreshStats);

/**
 * Returns the version payload for one family directly from jsDelivr metadata.
 */
export const getVersions = async (
	id: string,
	hasVariable: boolean,
): Promise<VersionResponse> => {
	const [staticVersions, variableVersions] = await Promise.all([
		getPublishedVersions(id, false),
		hasVariable ? getPublishedVersions(id, true) : undefined,
	]);

	return buildVersionResponse(staticVersions, variableVersions);
};

export const getPublishedVersions = async (
	id: string,
	isVariable: boolean,
): Promise<string[]> =>
	fetchPackageVersions(id, KV_CACHE_TTLS.versions, isVariable);

/**
 * Reads one family directly from the catalog map.
 */
export const getFontById = async (
	c: Context<AppEnv>,
	id: string,
): Promise<SourceFontMetadata | undefined> => {
	const catalog = await getCatalog(c);
	return catalog[id];
};
