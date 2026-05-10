import {
	createExecutionContext,
	waitOnExecutionContext,
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import type { Zippable } from 'fflate';
import { zipSync } from 'fflate';
import { HTTPException } from 'hono/http-exception';
import { vi } from 'vitest';
import type { AxisRegistry } from '../shared/axis-registry';
import {
	type BuildVersionRequest,
	type BuildVersionResponse,
	getBuildKey,
	getBuildRequestKey,
	getFamilyBuildRequestKey,
} from '../shared/build';
import type {
	FontCatalog,
	SourceFontMetadata,
	VariableAxes,
} from '../shared/catalog';
import {
	type FontPackageEntry,
	findFontPackageEntry,
	resolveFontPackageManifest,
} from '../shared/font-package-manifest';
import {
	BINARY_CONTENT_TYPES,
	getDownloadContentDisposition,
	IMMUTABLE_ASSET_CACHE_CONTROL,
} from '../shared/http-metadata';
import type { StatsResponse } from '../shared/stats';
import {
	getDownloadKey,
	getStaticAssetKey,
	getVariableAssetKey,
} from '../shared/storage';
import { KV_KEYS, UPSTREAM_URLS } from '../worker/src/constants';
import type { VersionResponse } from '../worker/src/features/metadata/store';
import { clearMetadataCachesForTest } from '../worker/src/features/metadata/store';
import worker from '../worker/src/index';
import staticWoffUrl from './fixtures/fonts/abel-latin-400-normal.woff?inline';
import staticWoff2Url from './fixtures/fonts/abel-latin-400-normal.woff2?inline';
import variableWoff2Url from './fixtures/fonts/recursive-latin-full-normal.woff2?inline';

export const testEnv = env as unknown as Env;

export const dispatch = async (
	input: string | Request,
): Promise<{ response: Response; settle: () => Promise<void> }> => {
	const request = typeof input === 'string' ? new Request(input) : input;
	const ctx = createExecutionContext();
	const response = await worker.fetch(request, testEnv, ctx);

	return {
		response,
		settle: async () => {
			await waitOnExecutionContext(ctx);
		},
	};
};

export const jsonSnapshot = async (input: string | Request) => {
	const { response, settle } = await dispatch(input);
	const body = await response.json();
	await settle();
	return { status: response.status, headers: serializeHeaders(response), body };
};

export const textSnapshot = async (input: string | Request) => {
	const { response, settle } = await dispatch(input);
	const body = await response.text();
	await settle();
	return { status: response.status, headers: serializeHeaders(response), body };
};

export const setupWorkerTest = async (): Promise<void> => {
	clearMetadataCachesForTest();
	installUpstreamFetchMock();
	installArtifactBuilderMock(testEnv);
	await clearFontBucket(testEnv);
	await seedMetadata(testEnv);
};

export const serializeHeaders = (
	response: Response,
): Record<string, string> => {
	const result: Record<string, string> = {};
	const cacheControl = response.headers.get('Cache-Control');
	const cdnCacheControl = response.headers.get('CDN-Cache-Control');
	const contentDisposition = response.headers.get('Content-Disposition');
	const contentType = response.headers.get('Content-Type');
	const etag = response.headers.get('ETag');
	const location = response.headers.get('Location');
	const lastModified = response.headers.get('Last-Modified');

	if (cacheControl) result.cacheControl = cacheControl;
	if (cdnCacheControl) result.cdnCacheControl = cdnCacheControl;
	if (contentDisposition) result.contentDisposition = contentDisposition;
	if (contentType) result.contentType = contentType;
	if (etag) result.etag = '<etag>';
	if (location) result.location = location;
	if (lastModified) result.lastModified = '<last-modified>';

	return result;
};

export const testCatalog: FontCatalog = {
	abel: {
		id: 'abel',
		family: 'Abel',
		subsets: ['latin'],
		weights: [400],
		styles: ['normal'],
		defSubset: 'latin',
		variable: false,
		lastModified: '2024-01-01',
		version: 'v1',
		category: 'sans-serif',
		license: {
			type: 'OFL-1.1',
			url: 'https://example.com/ofl',
			attribution: 'Example',
		},
		source: 'https://example.com',
		type: 'google',
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	},
	recursive: {
		id: 'recursive',
		family: 'Recursive',
		subsets: ['latin'],
		weights: [400],
		styles: ['normal'],
		defSubset: 'latin',
		variable: {
			MONO: {
				default: '0',
				min: '0',
				max: '1',
				step: '1',
			},
		},
		lastModified: '2024-01-02',
		version: 'v1',
		category: 'sans-serif',
		license: {
			type: 'OFL-1.1',
			url: 'https://example.com/ofl',
			attribution: 'Example',
		},
		source: 'https://example.com',
		type: 'google',
		unicodeRange: {
			latin: 'U+0000-00FF',
		},
	},
	familypack: {
		id: 'familypack',
		family: 'Family Pack',
		subsets: ['latin', 'latin-ext'],
		weights: [400, 700],
		styles: ['normal'],
		defSubset: 'latin',
		variable: false,
		lastModified: '2024-01-03',
		version: 'v1',
		category: 'sans-serif',
		license: {
			type: 'OFL-1.1',
			url: 'https://example.com/ofl',
			attribution: 'Example',
		},
		source: 'https://example.com',
		type: 'google',
		unicodeRange: {
			latin: 'U+0000-00FF',
			'latin-ext': 'U+0100-024F',
		},
	},
};

export const scheduledCatalog = {
	abel: testCatalog.abel,
} satisfies FontCatalog;

export const staticMetadata: SourceFontMetadata = testCatalog.abel;
export const variableMetadata: SourceFontMetadata = testCatalog.recursive;
export const variableAxes = testCatalog.recursive.variable as VariableAxes;

export const testAxisRegistry: AxisRegistry = {
	MONO: {
		name: 'Monospace',
		description: 'Monospace axis',
		min: 0,
		max: 1,
		default: 0,
		precision: 1,
	},
};

export const scheduledAxisRegistry = [
	{
		tag: 'MONO',
		name: 'Monospace',
		description: 'Monospace axis',
		min: 0,
		max: 1,
		default: 0,
		precision: 1,
	},
];

export const testStats: Record<string, StatsResponse> = {
	abel: {
		total: {
			npmDownloadMonthly: 10,
			npmDownloadTotal: 100,
			jsDelivrHitsMonthly: 20,
			jsDelivrHitsTotal: 200,
		},
		static: {
			npmDownloadMonthly: 10,
			npmDownloadTotal: 100,
			jsDelivrHitsMonthly: 20,
			jsDelivrHitsTotal: 200,
		},
	},
	recursive: {
		total: {
			npmDownloadMonthly: 15,
			npmDownloadTotal: 150,
			jsDelivrHitsMonthly: 25,
			jsDelivrHitsTotal: 250,
		},
		static: {
			npmDownloadMonthly: 5,
			npmDownloadTotal: 50,
			jsDelivrHitsMonthly: 10,
			jsDelivrHitsTotal: 100,
		},
		variable: {
			npmDownloadMonthly: 10,
			npmDownloadTotal: 100,
			jsDelivrHitsMonthly: 15,
			jsDelivrHitsTotal: 150,
		},
	},
};

export const testVersions: Record<string, VersionResponse> = {
	abel: {
		latest: '5.0.0',
		static: ['5.0.0'],
	},
	recursive: {
		latest: '5.0.0',
		static: ['5.0.0'],
		latestVariable: '5.0.0',
		variable: ['5.0.0'],
	},
	familypack: {
		latest: '5.0.0',
		static: ['5.0.0'],
	},
};

const decodeInlineAsset = (value: string): Uint8Array => {
	const [, encoded = ''] = value.split(',', 2);
	const binary = atob(encoded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
};

export const staticWoff2Bytes = decodeInlineAsset(staticWoff2Url);
export const staticWoffBytes = decodeInlineAsset(staticWoffUrl);
export const variableWoff2Bytes = decodeInlineAsset(variableWoff2Url);
export const staticTtfBytes = new Uint8Array([0, 1, 2, 3]);

const isStaticEntry = (
	item: FontPackageEntry,
): item is ReturnType<typeof resolveFontPackageManifest>['static'][number] =>
	!('axisKey' in item);

const toResponse = (body: BodyInit, init?: ResponseInit): Response =>
	new Response(body, {
		status: 200,
		headers: {
			...(body instanceof Uint8Array
				? { 'Content-Length': String(body.byteLength) }
				: typeof body === 'string'
					? {
							'Content-Length': String(
								new TextEncoder().encode(body).byteLength,
							),
						}
					: {}),
			...(init?.headers ?? {}),
		},
		...init,
	});

const staticBinaryResponse = (url: string): Response => {
	if (url.endsWith('.woff2')) {
		return toResponse(staticWoff2Bytes);
	}

	if (url.endsWith('.woff')) {
		return toResponse(staticWoffBytes);
	}

	throw new Error(`Unexpected static asset URL: ${url}`);
};

const packageFileMetaResponse = (
	packageName: string,
	_version: string,
): Response => {
	const isVariable = packageName.startsWith('@fontsource-variable/');
	const id = packageName.replace(/^@fontsource(?:-variable)?\//, '');
	const metadata = testCatalog[id];

	if (!metadata) {
		throw new Error(`Unexpected package file metadata fetch: ${packageName}`);
	}

	const manifest = resolveFontPackageManifest(
		metadata,
		isVariable ? (metadata.variable as VariableAxes | undefined) : undefined,
	);
	const entries = isVariable ? manifest.variable : manifest.static;
	const files = Array.from(
		new Set(entries.map((item) => item.sourceFilename)),
	).map((name) => ({
		name: `/files/${id}-${name}`,
	}));

	return toResponse(
		JSON.stringify({
			files,
		}),
	);
};

export const seedMetadata = async (env: Env): Promise<void> => {
	await env.METADATA.put(KV_KEYS.catalog, JSON.stringify(testCatalog));
	await env.METADATA.put(
		KV_KEYS.axisRegistry,
		JSON.stringify(testAxisRegistry),
	);
	await env.METADATA.put(KV_KEYS.stats, JSON.stringify(testStats));
};

export const clearFontBucket = async (env: Env): Promise<void> => {
	const list = await env.FONTS.list();

	await Promise.all(list.objects.map((object) => env.FONTS.delete(object.key)));
};

const putBuiltObject = async (
	env: Env,
	key: string,
	body: Uint8Array,
	options: {
		contentDisposition?: string;
		contentType: keyof typeof BINARY_CONTENT_TYPES;
	},
): Promise<void> => {
	await env.FONTS.put(key, body, {
		httpMetadata: {
			cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
			contentDisposition: options.contentDisposition,
			contentType: BINARY_CONTENT_TYPES[options.contentType],
		},
	});
};

const putStaticArtifact = async (
	env: Env,
	metadata: SourceFontMetadata,
	version: string,
	item: ReturnType<typeof resolveFontPackageManifest>['static'][number],
): Promise<Uint8Array> => {
	const bytes =
		item.extension === 'woff2'
			? staticWoff2Bytes
			: item.extension === 'woff'
				? staticWoffBytes
				: staticTtfBytes;

	await putBuiltObject(
		env,
		getStaticAssetKey(metadata.id, version, item.filename),
		bytes,
		{
			contentType: item.extension,
		},
	);

	return bytes;
};

const putVariableArtifact = async (
	env: Env,
	metadata: SourceFontMetadata,
	version: string,
	item: ReturnType<typeof resolveFontPackageManifest>['variable'][number],
): Promise<Uint8Array> => {
	await putBuiltObject(
		env,
		getVariableAssetKey(metadata.id, version, item.filename),
		variableWoff2Bytes,
		{
			contentType: item.extension,
		},
	);

	return variableWoff2Bytes;
};

const putStaticArtifacts = async (
	env: Env,
	metadata: SourceFontMetadata,
	version: string,
	zipFiles: Zippable,
): Promise<number> => {
	let artifactCount = 0;

	for (const item of resolveFontPackageManifest(metadata).static) {
		const bytes = await putStaticArtifact(env, metadata, version, item);
		zipFiles[item.archivePath] =
			item.buildMode === 'copy' ? [bytes, { level: 0 }] : bytes;
		artifactCount += 1;
	}

	return artifactCount;
};

const putVariableArtifacts = async (
	env: Env,
	metadata: SourceFontMetadata,
	axes: VariableAxes,
	version: string,
	zipFiles: Zippable,
): Promise<number> => {
	let artifactCount = 0;

	for (const item of resolveFontPackageManifest(metadata, axes).variable) {
		const bytes = await putVariableArtifact(env, metadata, version, item);
		zipFiles[item.archivePath] = [bytes, { level: 0 }];
		artifactCount += 1;
	}

	return artifactCount;
};

const putCombinedArtifacts = async (
	env: Env,
	request: BuildVersionRequest,
): Promise<number> => {
	const { metadata, tag, axes } = request;
	const zipFiles: Zippable = {};
	let artifactCount = await putStaticArtifacts(
		env,
		metadata,
		tag.version,
		zipFiles,
	);

	if (axes) {
		artifactCount += await putVariableArtifacts(
			env,
			metadata,
			axes,
			tag.version,
			zipFiles,
		);
	}

	if (artifactCount === 0) {
		throw new Error(
			`Mocked build produced no artifacts for ${tag.id}@${tag.version}`,
		);
	}

	zipFiles.LICENSE = new TextEncoder().encode('Example License');
	await putBuiltObject(
		env,
		getDownloadKey(metadata.id, tag.version),
		zipSync(zipFiles),
		{
			contentDisposition: getDownloadContentDisposition(
				metadata.id,
				tag.version,
			),
			contentType: 'zip',
		},
	);

	return artifactCount + 1;
};

const putRequestedArtifact = async (
	env: Env,
	request: BuildVersionRequest,
): Promise<number> => {
	if (request.mode !== 'file') {
		return await putCombinedArtifacts(env, request);
	}

	const manifest = resolveFontPackageManifest(request.metadata, request.axes);
	const entry = findFontPackageEntry(manifest, request.target);

	if (!entry) {
		throw new Error(
			`Mocked build produced no artifact for ${request.tag.id}@${request.tag.version}/${request.target.file}`,
		);
	}

	if (request.target.isVariable) {
		if (isStaticEntry(entry)) {
			throw new Error(
				`Mocked build resolved a static artifact for variable target ${request.target.file}`,
			);
		}

		await putVariableArtifact(
			env,
			request.metadata,
			request.tag.version,
			entry,
		);
		return 1;
	}

	if (!isStaticEntry(entry)) {
		throw new Error(
			`Mocked build resolved a variable artifact for static target ${request.target.file}`,
		);
	}

	await putStaticArtifact(env, request.metadata, request.tag.version, entry);
	return 1;
};

export const installArtifactBuilderMock = (
	env: Env,
	options: {
		failBuildKeys?: string[];
		failBuilds?: Array<{
			buildKey: string;
			mode?: BuildVersionRequest['mode'];
			status?: number;
		}>;
		buildDelayMs?: number;
	} = {},
) => {
	const failBuildKeys = new Set(options.failBuildKeys ?? []);
	const failBuilds = options.failBuilds ?? [];
	const buildDelayMs = options.buildDelayMs ?? 0;
	const calls = vi.fn<(request: BuildVersionRequest) => void>();
	const activeBuilds = new Map<string, Promise<BuildVersionResponse>>();

	const ensureBuilt = async (
		request: BuildVersionRequest,
	): Promise<BuildVersionResponse> => {
		const buildKey = getBuildKey(request.tag);
		const activeFamilyBuild = activeBuilds.get(
			getFamilyBuildRequestKey(request.tag),
		);

		if (request.mode === 'file' && activeFamilyBuild) {
			return await activeFamilyBuild;
		}

		const requestKey = getBuildRequestKey(request);
		const activeBuild = activeBuilds.get(requestKey);

		if (activeBuild) {
			return await activeBuild;
		}

		calls(request);

		if (
			failBuildKeys.has(buildKey) ||
			failBuilds.some(
				(item) =>
					item.buildKey === buildKey &&
					(!item.mode || item.mode === request.mode),
			)
		) {
			const matchingFailure = failBuilds.find(
				(item) =>
					item.buildKey === buildKey &&
					(!item.mode || item.mode === request.mode),
			);

			if (matchingFailure?.status) {
				return await Promise.reject(
					new HTTPException(matchingFailure.status === 404 ? 404 : 500, {
						message: `Mocked builder failure for ${buildKey}`,
					}),
				);
			}

			return await Promise.reject(
				new Error(`Mocked builder failure for ${buildKey}`),
			);
		}

		const buildPromise = (async () => {
			if (buildDelayMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, buildDelayMs));
			}

			const artifactCount = await putRequestedArtifact(env, request);
			const response = {
				state: 'ready',
				buildKey,
				mode: request.mode,
				artifactCount,
			} satisfies BuildVersionResponse;
			return response;
		})().finally(() => {
			activeBuilds.delete(requestKey);
		});

		activeBuilds.set(requestKey, buildPromise);
		return await buildPromise;
	};

	const artifactBuilder = {
		getByName(name: string) {
			return {
				async buildVersion(
					payload: BuildVersionRequest,
				): Promise<BuildVersionResponse> {
					try {
						return await ensureBuilt(payload);
					} catch (error) {
						if (error instanceof HTTPException) {
							throw error;
						}

						throw new Error(
							error instanceof Error
								? error.message
								: `Mocked builder failure for ${name}: ${String(error)}`,
						);
					}
				},
			} as unknown as ReturnType<Env['ARTIFACT_BUILDER']['getByName']>;
		},
	};

	(
		env as Env & {
			ARTIFACT_BUILDER: Env['ARTIFACT_BUILDER'];
		}
	).ARTIFACT_BUILDER = artifactBuilder as unknown as Env['ARTIFACT_BUILDER'];

	return { calls };
};

export const installUpstreamFetchMock = (
	overrides: Record<
		string,
		Response | (() => Response | Promise<Response>)
	> = {},
) => {
	const originalFetch = globalThis.fetch.bind(globalThis);

	return vi
		.spyOn(globalThis, 'fetch')
		.mockImplementation(async (input, init) => {
			const versionPayloads: Record<string, string[]> = {
				'@fontsource/abel': testVersions.abel.static,
				'@fontsource/recursive': testVersions.recursive.static,
				'@fontsource/familypack': testVersions.familypack.static,
				'@fontsource-variable/recursive': testVersions.recursive.variable ?? [],
			};

			const url =
				typeof input === 'string'
					? input
					: input instanceof Request
						? input.url
						: input.toString();

			const override = overrides[url];
			if (override) {
				return typeof override === 'function'
					? await override()
					: override.clone();
			}

			if (url.startsWith(`${UPSTREAM_URLS.jsdelivrPackage}/`)) {
				const path = url.slice(`${UPSTREAM_URLS.jsdelivrPackage}/`.length);

				if (path.endsWith('/flat')) {
					const withoutFlat = path.slice(0, -'/flat'.length);
					const packageRef = withoutFlat.replace(/@([^@/]+)$/, '');
					const version = withoutFlat.match(/@([^@/]+)$/)?.[1];

					if (!version) {
						throw new Error(`Unexpected jsDelivr flat URL: ${url}`);
					}

					return packageFileMetaResponse(packageRef, version);
				}

				const versions = versionPayloads[path];

				if (!versions) {
					throw new Error(`Unexpected package metadata fetch: ${url}`);
				}

				return toResponse(
					JSON.stringify({
						versions: versions.map((version: string) => ({ version })),
					}),
				);
			}

			if (url.startsWith(`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/`)) {
				if (url.endsWith('/LICENSE')) {
					return toResponse('Example License');
				}

				return staticBinaryResponse(url);
			}

			if (
				url.startsWith(`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource-variable/`)
			) {
				if (url.endsWith('/LICENSE')) {
					return toResponse('Example License');
				}

				if (url.endsWith('.woff2')) {
					return toResponse(variableWoff2Bytes);
				}
			}

			switch (url) {
				case UPSTREAM_URLS.catalog:
					return toResponse(JSON.stringify(scheduledCatalog));
				case UPSTREAM_URLS.axisRegistry:
					return toResponse(JSON.stringify(scheduledAxisRegistry));
				case UPSTREAM_URLS.stats.npmMonth:
					return toResponse(
						JSON.stringify({
							'@fontsource/abel': 3,
							'@fontsource/familypack': 2,
						}),
					);
				case UPSTREAM_URLS.stats.npmTotal:
					return toResponse(
						JSON.stringify({
							'@fontsource/abel': 30,
						}),
					);
				case UPSTREAM_URLS.stats.jsdelivrMonth:
					return toResponse(
						JSON.stringify({
							'@fontsource/abel': 4,
						}),
					);
				case UPSTREAM_URLS.stats.jsdelivrTotal:
					return toResponse(
						JSON.stringify({
							'@fontsource/abel': 40,
						}),
					);
				default:
					if (
						url.startsWith('data:') ||
						url.endsWith('.wasm') ||
						url.includes('.wasm?')
					) {
						return await originalFetch(input, init);
					}

					throw new Error(`Unexpected upstream fetch: ${url}`);
			}
		});
};
