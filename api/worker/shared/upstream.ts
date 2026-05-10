import { HTTPException } from 'hono/http-exception';

interface JsDelivrPackageResponse {
	versions?: Array<{ version: string }>;
}

interface JsDelivrFlatResponse {
	files?: Array<{ name: string }>;
}

export class UpstreamNotFoundError extends Error {
	constructor(url: string) {
		super(`Upstream resource not found: ${url}`);
		this.name = 'UpstreamNotFoundError';
	}
}

/**
 * Canonical upstream endpoints for metadata, package files, and public CDN URLs.
 */
export const UPSTREAM_URLS = {
	catalog:
		'https://raw.githubusercontent.com/fontsource/font-files/main/metadata/fontsource.json',
	axisRegistry:
		'https://raw.githubusercontent.com/fontsource/font-files/main/metadata/axis-registry.json',
	stats: {
		npmMonth:
			'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/lastMonthPopular.json',
		npmTotal:
			'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/totalPopular.json',
		jsdelivrMonth:
			'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/jsDelivrMonthPopular.json',
		jsdelivrTotal:
			'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/jsDelivrTotalPopular.json',
	},
	jsdelivrPackage: 'https://data.jsdelivr.com/v1/packages/npm',
	jsdelivrNpm: 'https://cdn.jsdelivr.net/npm',
	publicApi: 'https://api.fontsource.org',
	publicCdn: 'https://cdn.jsdelivr.net/fontsource',
} as const;

interface CloudflareCacheOptions {
	cacheEverything?: boolean;
	cacheTtl?: number;
	cacheTtlByStatus?: Record<string, number>;
}

/**
 * Shared fetch wrapper that applies Cloudflare cache hints and normalizes
 * upstream failures.
 */
const fetchWithCache = async (
	url: string,
	cf?: CloudflareCacheOptions,
): Promise<Response> => {
	const init = cf ? ({ cf } as RequestInit) : undefined;
	const response = await fetch(url, init);

	if (!response.ok) {
		if (response.status === 404) {
			throw new UpstreamNotFoundError(url);
		}

		throw new HTTPException(502, {
			message: `Bad Gateway. Failed to fetch ${url}: ${response.status}`,
		});
	}

	return response;
};

/** Fetches an upstream binary with asset-specific cache policy. */
const fetchBinaryBytes = async (url: string): Promise<Uint8Array> =>
	(
		await fetchWithCache(url, {
			cacheEverything: true,
			cacheTtlByStatus: {
				'200-299': 86400,
				404: 60,
				'500-599': 0,
			},
		})
	).bytes();

const packageScope = (isVariable: boolean): string =>
	isVariable ? '@fontsource-variable' : '@fontsource';

const packageName = (id: string, isVariable: boolean): string =>
	`${packageScope(isVariable)}/${id}`;

export const fetchCachedJson = async <T>(
	url: string,
	cacheTtl: number,
): Promise<T> =>
	(await (
		await fetchWithCache(url, {
			cacheEverything: true,
			cacheTtl,
		})
	).json()) as T;

export const fetchPackageVersions = async (
	id: string,
	cacheTtl: number,
	isVariable = false,
): Promise<string[]> => {
	const payload = await fetchCachedJson<JsDelivrPackageResponse>(
		`${UPSTREAM_URLS.jsdelivrPackage}/${packageName(id, isVariable)}`,
		cacheTtl,
	);

	return (payload.versions ?? []).map((item) => item.version);
};

export const fetchPackageFileList = async (
	id: string,
	version: string,
	isVariable = false,
): Promise<Set<string>> => {
	const payload = await fetchCachedJson<JsDelivrFlatResponse>(
		`${UPSTREAM_URLS.jsdelivrPackage}/${packageName(id, isVariable)}@${version}/flat`,
		86400,
	);
	const prefix = `/files/${id}-`;

	return new Set(
		(payload.files ?? [])
			.map((item) => item.name)
			.filter((name) => name.startsWith(prefix))
			.map((name) => name.slice(prefix.length)),
	);
};

export const fetchPackageAssetBytes = async (
	id: string,
	version: string,
	file: string,
	isVariable = false,
): Promise<Uint8Array> =>
	fetchBinaryBytes(
		`${UPSTREAM_URLS.jsdelivrNpm}/${packageName(id, isVariable)}@${version}/files/${id}-${file}`,
	);

export const fetchPackageLicenseBytes = async (
	id: string,
	version: string,
	isVariable = false,
): Promise<Uint8Array> =>
	fetchBinaryBytes(
		`${UPSTREAM_URLS.jsdelivrNpm}/${packageName(id, isVariable)}@${version}/LICENSE`,
	);
