import {
	createExecutionContext,
	waitOnExecutionContext,
} from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import type { Zippable } from 'fflate';
import { zipSync } from 'fflate';
import { vi } from 'vitest';
import type { AxisRegistry } from '../shared/axis-registry';
import {
	type BuildDownloadRequest,
	type BuildVersionFailure,
	type BuildVersionRequest,
	type BuildVersionResponse,
	type BuildVersionResult,
	type BuildVersionStatus,
	getBuildKey,
} from '../shared/build';
import type {
	FontCatalog,
	SourceFontMetadata,
	VariableAxes,
} from '../shared/catalog';
import { resolveFontPackageManifest } from '../shared/font-package-manifest';
import {
	BINARY_CONTENT_TYPES,
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
	const edgeCacheControl = response.headers.get('Cloudflare-CDN-Cache-Control');
	const contentDisposition = response.headers.get('Content-Disposition');
	const contentType = response.headers.get('Content-Type');
	const etag = response.headers.get('ETag');
	const location = response.headers.get('Location');
	const lastModified = response.headers.get('Last-Modified');

	if (cacheControl) result.cacheControl = cacheControl;
	if (cdnCacheControl) result.cdnCacheControl = cdnCacheControl;
	if (edgeCacheControl) result.edgeCacheControl = edgeCacheControl;
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
		contentType: keyof typeof BINARY_CONTENT_TYPES;
	},
): Promise<void> => {
	await env.FONTS.put(key, body, {
		httpMetadata: {
			cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
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
		zipFiles[`static/${metadata.id}-${item.filename}`] =
			item.extension === 'ttf' ? bytes : [bytes, { level: 0 }];
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
		zipFiles[`variable/${metadata.id}-${item.filename}`] = [
			bytes,
			{ level: 0 },
		];
		artifactCount += 1;
	}

	return artifactCount;
};

const putDownloadArtifacts = async (
	env: Env,
	request: BuildDownloadRequest,
): Promise<number> => {
	const { metadata } = request;
	const axes = metadata.variable || undefined;
	const zipFiles: Zippable = {};
	let artifactCount = await putStaticArtifacts(
		env,
		metadata,
		request.staticVersion,
		zipFiles,
	);

	if (axes && request.variableVersion) {
		artifactCount += await putVariableArtifacts(
			env,
			metadata,
			axes,
			request.variableVersion,
			zipFiles,
		);
	}

	if (artifactCount === 0) {
		throw new Error(
			`Mocked build produced no artifacts for ${metadata.id}@${request.staticVersion}`,
		);
	}

	zipFiles.LICENSE = new TextEncoder().encode('Example License');
	await putBuiltObject(
		env,
		getDownloadKey(metadata.id, request.staticVersion, request.variableVersion),
		zipSync(zipFiles),
		{
			contentType: 'zip',
		},
	);

	return artifactCount + 1;
};

const putBuiltArtifacts = async (
	env: Env,
	request: BuildVersionRequest,
): Promise<void> => {
	if (request.mode === 'download') {
		await putDownloadArtifacts(env, request);
		return;
	}

	const manifest = resolveFontPackageManifest(
		request.metadata,
		request.metadata.variable || undefined,
	);
	const entries =
		request.mode === 'variable' ? manifest.variable : manifest.static;
	if (entries.length === 0) {
		throw new Error(
			`Mocked build produced no ${request.mode} artifacts for ${request.tag.id}@${request.tag.version}`,
		);
	}

	if (request.mode === 'variable') {
		await Promise.all(
			manifest.variable.map((entry) =>
				putVariableArtifact(env, request.metadata, request.tag.version, entry),
			),
		);
	} else {
		await Promise.all(
			manifest.static.map((entry) =>
				putStaticArtifact(env, request.metadata, request.tag.version, entry),
			),
		);
	}
};

export const installArtifactBuilderMock = (
	env: Env,
	options: {
		failBuildKeys?: string[];
		buildDelayMs?: number;
	} = {},
) => {
	const failBuildKeys = new Set(options.failBuildKeys ?? []);
	const buildDelayMs = options.buildDelayMs ?? 0;
	const calls = vi.fn<(request: BuildVersionRequest) => void>();
	const activeBuilds = new Map<string, Promise<BuildVersionResponse>>();
	const failedBuilds = new Map<string, BuildVersionFailure>();

	const ensureBuilt = async (
		request: BuildVersionRequest,
	): Promise<BuildVersionResponse> => {
		const buildKey = getBuildKey(request);
		const activeBuild = activeBuilds.get(buildKey);

		if (activeBuild) {
			return await activeBuild;
		}

		calls(request);

		if (failBuildKeys.has(buildKey)) {
			return await Promise.reject(
				new Error(`Mocked builder failure for ${buildKey}`),
			);
		}

		const buildPromise = (async () => {
			if (buildDelayMs > 0) {
				await new Promise((resolve) => setTimeout(resolve, buildDelayMs));
			}

			await putBuiltArtifacts(env, request);
			const response = {
				state: 'ready',
				buildKey,
			} satisfies BuildVersionResponse;
			return response;
		})().finally(() => {
			activeBuilds.delete(buildKey);
		});

		activeBuilds.set(buildKey, buildPromise);
		return await buildPromise;
	};
	const buildVersion = async (
		request: BuildVersionRequest,
	): Promise<BuildVersionResult> => {
		try {
			return await ensureBuilt(request);
		} catch (error) {
			const buildKey = getBuildKey(request);
			return {
				state: 'failed',
				buildKey,
				status: 502,
				error: `Bad Gateway. Artifact build failed for ${buildKey}: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	};
	const startBuild = async (
		request: BuildVersionRequest,
	): Promise<BuildVersionStatus> => {
		const buildKey = getBuildKey(request);
		const failed = failedBuilds.get(buildKey);

		if (failed) {
			failedBuilds.delete(buildKey);
			return failed;
		}

		if (activeBuilds.has(buildKey)) {
			return {
				state: 'building',
				buildKey,
			};
		}

		void buildVersion(request).then((result) => {
			if (result.state === 'failed') {
				failedBuilds.set(buildKey, result);
			}
		});

		return {
			state: 'building',
			buildKey,
		};
	};

	const artifactBuilder = {
		getByName() {
			return {
				buildVersion,
				startBuild,
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

				if (path.endsWith('?structure=flat')) {
					const packageVersion = path.slice(0, -'?structure=flat'.length);
					const packageRef = packageVersion.replace(/@([^@/]+)$/, '');
					const version = packageVersion.match(/@([^@/]+)$/)?.[1];

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
