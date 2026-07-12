import { unzipSync, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SourceFontMetadata } from '../shared/catalog';
import { KV_KEYS, UPSTREAM_URLS } from '../worker/src/constants';
import { clearMetadataCachesForTest } from '../worker/src/features/metadata/store';
import {
	dispatch,
	installArtifactBuilderMock,
	installUpstreamFetchMock,
	jsonSnapshot,
	setupWorkerTest,
	staticTtfBytes,
	staticWoff2Bytes,
	testCatalog,
	testEnv,
	textSnapshot,
	variableWoff2Bytes,
} from './helpers';

const slantedMetadata: SourceFontMetadata = {
	id: 'slanted',
	family: 'Slanted',
	subsets: ['latin'],
	weights: [400],
	styles: ['normal'],
	defSubset: 'latin',
	variable: {
		MONO: {
			default: '0',
			min: '0',
			max: '1',
			step: '0.01',
		},
		slnt: {
			default: '0',
			min: '-15',
			max: '0',
			step: '1',
		},
		wght: {
			default: '400',
			min: '300',
			max: '900',
			step: '1',
		},
	},
	lastModified: '2024-01-04',
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
};

describe('cdn routes', () => {
	beforeEach(async () => {
		await setupWorkerTest();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('resolves floating static asset requests without fetching variable versions', async () => {
		vi.restoreAllMocks();
		const fetchSpy = installUpstreamFetchMock();
		await testEnv.FONTS.put(
			'recursive@5.0.0/latin-400-normal.woff2',
			staticWoff2Bytes,
		);

		const result = await dispatch(
			'https://fontsource.test/fonts/recursive@latest/latin-400-normal.woff2',
		);
		await result.response.arrayBuffer();
		await result.settle();

		const packageRequests = fetchSpy.mock.calls
			.map(([input]) =>
				typeof input === 'string'
					? input
					: input instanceof Request
						? input.url
						: input.toString(),
			)
			.filter((url) => url.startsWith(`${UPSTREAM_URLS.jsdelivrPackage}/`));

		expect(packageRequests).toEqual([
			`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/recursive`,
		]);
	});

	it('resolves floating variable asset requests without fetching static versions', async () => {
		vi.restoreAllMocks();
		const fetchSpy = installUpstreamFetchMock();
		await testEnv.FONTS.put(
			'recursive@5.0.0/variable/latin-full-normal.woff2',
			variableWoff2Bytes,
		);

		const result = await dispatch(
			'https://fontsource.test/fonts/recursive:vf@latest/latin-full-normal.woff2',
		);
		await result.response.arrayBuffer();
		await result.settle();

		const packageRequests = fetchSpy.mock.calls
			.map(([input]) =>
				typeof input === 'string'
					? input
					: input instanceof Request
						? input.url
						: input.toString(),
			)
			.filter((url) => url.startsWith(`${UPSTREAM_URLS.jsdelivrPackage}/`));

		expect(packageRequests).toEqual([
			`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource-variable/recursive`,
		]);
	});

	it('serves 304 responses for If-Modified-Since through R2 preconditions', async () => {
		const url =
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.woff2';
		await testEnv.FONTS.put(
			'abel@5.0.0/latin-400-normal.woff2',
			staticWoff2Bytes,
		);

		const warm = await dispatch(url);
		await warm.response.arrayBuffer();
		await warm.settle();

		const lastModified = warm.response.headers.get('Last-Modified');
		expect(lastModified).toBeTruthy();

		const notModified = await dispatch(
			new Request(url, {
				headers: {
					'If-Modified-Since': lastModified ?? '',
				},
			}),
		);
		await notModified.settle();

		expect(notModified.response.status).toBe(304);
		expect(notModified.response.headers.get('Last-Modified')).toBe(
			lastModified,
		);
		expect(notModified.response.headers.get('ETag')).toBeTruthy();
	});

	it('skips upstream version resolution for exact pinned asset requests', async () => {
		vi.restoreAllMocks();
		const fetchSpy = installUpstreamFetchMock();
		await testEnv.FONTS.put(
			'abel@5.0.0/latin-400-normal.woff2',
			staticWoff2Bytes,
		);

		const result = await dispatch(
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.woff2',
		);
		await result.response.arrayBuffer();
		await result.settle();

		const packageRequests = fetchSpy.mock.calls
			.map(([input]) =>
				typeof input === 'string'
					? input
					: input instanceof Request
						? input.url
						: input.toString(),
			)
			.filter((url) => url.startsWith(`${UPSTREAM_URLS.jsdelivrPackage}/`));

		expect(packageRequests).toEqual([]);
	});

	describe('public asset outputs', () => {
		beforeEach(async () => {
			await testEnv.FONTS.put(
				'abel@5.0.0/latin-400-normal.woff2',
				staticWoff2Bytes,
			);
			await testEnv.FONTS.put(
				'recursive@5.0.0/variable/latin-full-normal.woff2',
				variableWoff2Bytes,
			);
			await testEnv.FONTS.put(
				'recursive@5.0.0/download.zip',
				zipSync({
					'static/recursive-latin-400-normal.woff2': staticWoff2Bytes,
					'static/recursive-latin-400-normal.woff': new Uint8Array([1]),
					'static/recursive-latin-400-normal.ttf': new Uint8Array([2]),
					'variable/recursive-latin-mono-normal.woff2': variableWoff2Bytes,
					'variable/recursive-latin-full-normal.woff2': variableWoff2Bytes,
					LICENSE: new TextEncoder().encode('Example License'),
				}),
			);
			await testEnv.FONTS.put(
				'abel@5.0.0/download.zip',
				zipSync({
					'static/abel-latin-400-normal.woff2': staticWoff2Bytes,
					'static/abel-latin-400-normal.woff': new Uint8Array([1]),
					'static/abel-latin-400-normal.ttf': new Uint8Array([2]),
					LICENSE: new TextEncoder().encode('Example License'),
				}),
			);
		});

		it('generates correct CSS output', async () => {
			expect(
				await textSnapshot('https://fontsource.test/css/abel@latest/index.css'),
			).toMatchSnapshot();
		});

		it('serves minified CSS aliases', async () => {
			const { response, settle } = await dispatch(
				'https://fontsource.test/css/familypack@latest/latin.min.css',
			);
			const css = await response.text();
			await settle();

			expect(response.status).toBe(200);
			expect(css).not.toContain('\n');
			expect(css).not.toContain('/*');
			expect(css.match(/@font-face{/g)).toHaveLength(2);
			expect(css).toContain("font-family:'Family Pack';");
		});

		it('generates variable CSS output', async () => {
			const { response, settle } = await dispatch(
				'https://fontsource.test/css/recursive:vf@latest/index.css',
			);
			const css = await response.text();
			await settle();

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe(
				'text/css; charset=utf-8',
			);
			expect(css).toContain("font-family: 'Recursive Variable'");
			expect(css).toContain('recursive:vf@5.0.0/');
			expect(css).toContain('.woff2');
		});

		it('serves published CSS filenames for custom variable axes', async () => {
			await testEnv.METADATA.put(
				KV_KEYS.catalog,
				JSON.stringify({
					...testCatalog,
					slanted: slantedMetadata,
				}),
			);
			clearMetadataCachesForTest();

			const { response, settle } = await dispatch(
				'https://fontsource.test/css/slanted:vf@5.0.0/index.css',
			);
			const css = await response.text();
			await settle();

			expect(response.status).toBe(200);
			expect(css).toContain('font-style: oblique 0deg 15deg;');
			expect(css).toContain('slanted:vf@5.0.0/latin-full-normal.woff2');
			expect(css).not.toContain('oblique%200deg%2015deg');

			const customAxis = await dispatch(
				'https://fontsource.test/css/slanted:vf@5.0.0/mono.css',
			);
			const customAxisCss = await customAxis.response.text();
			await customAxis.settle();

			expect(customAxis.response.status).toBe(200);
			expect(customAxisCss).toContain(
				'slanted:vf@5.0.0/latin-mono-normal.woff2',
			);
		});

		it('serves static font assets with immutable caching', async () => {
			const url =
				'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.woff2';

			const cold = await dispatch(url);
			const coldBytes = await cold.response.arrayBuffer();
			await cold.settle();
			expect(cold.response.status).toBe(200);
			expect(coldBytes.byteLength).toBe(staticWoff2Bytes.byteLength);
			expect(cold.response.headers.get('Content-Type')).toBe('font/woff2');
			expect(cold.response.headers.get('Cache-Control')).toBe(
				'public, max-age=31536000, immutable',
			);
			expect(cold.response.headers.get('CDN-Cache-Control')).toBe(
				'public, max-age=31536000, immutable',
			);
			expect(cold.response.headers.get('Cloudflare-CDN-Cache-Control')).toBe(
				'public, max-age=31536000, immutable',
			);

			// Warm request returns identical result
			const warm = await dispatch(url);
			const warmBytes = await warm.response.arrayBuffer();
			await warm.settle();
			expect(warm.response.status).toBe(200);
			expect(warmBytes.byteLength).toBe(staticWoff2Bytes.byteLength);
		});

		it('handles conditional requests with ETag', async () => {
			const url =
				'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.woff2';
			const warm = await dispatch(url);
			await warm.response.arrayBuffer();
			await warm.settle();

			const etag = warm.response.headers.get('ETag');
			expect(etag).toBeTruthy();

			const result = await dispatch(
				new Request(url, { headers: { 'If-None-Match': etag ?? '' } }),
			);
			await result.settle();
			expect(result.response.status).toBe(304);
		});

		it('serves variable font assets with floating version resolution', async () => {
			const result = await dispatch(
				'https://fontsource.test/fonts/recursive:vf@latest/latin-full-normal.woff2',
			);
			const bytes = await result.response.arrayBuffer();
			await result.settle();

			expect(result.response.status).toBe(200);
			expect(bytes.byteLength).toBe(variableWoff2Bytes.byteLength);
			expect(result.response.headers.get('Content-Type')).toBe('font/woff2');
		});
	});

	it('builds a download asynchronously and serves the archive when ready', async () => {
		const builder = installArtifactBuilderMock(testEnv, { buildDelayMs: 25 });
		const url = 'https://fontsource.test/v1/download/recursive';

		const [accepted, duplicate] = await Promise.all([
			dispatch(url),
			dispatch(url),
		]);
		expect(accepted.response.status).toBe(202);
		expect(await accepted.response.json()).toEqual({
			state: 'building',
			version: '5.0.0',
		});
		expect(duplicate.response.status).toBe(202);
		await duplicate.response.json();
		await Promise.all([accepted.settle(), duplicate.settle()]);

		for (let attempts = 0; attempts < 100; attempts += 1) {
			if (await testEnv.FONTS.head('recursive@5.0.0/download.zip')) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 1));
		}

		const result = await dispatch(url);
		const archive = unzipSync(
			new Uint8Array(await result.response.arrayBuffer()),
		);
		await result.settle();

		expect(result.response.status).toBe(200);
		expect(result.response.headers.get('Content-Disposition')).toBe(
			'attachment; filename="recursive.zip"',
		);
		expect(result.response.headers.get('Cache-Control')).toBe(
			'public, no-cache',
		);
		const etag = result.response.headers.get('ETag');
		expect(etag).toBeTruthy();
		expect(builder.calls).toHaveBeenCalledTimes(1);

		// Archive should contain static + variable files + LICENSE
		const files = Object.keys(archive).sort();
		expect(files).toEqual([
			'LICENSE',
			'static/recursive-latin-400-normal.ttf',
			'static/recursive-latin-400-normal.woff',
			'static/recursive-latin-400-normal.woff2',
			'variable/recursive-latin-full-normal.woff2',
			'variable/recursive-latin-mono-normal.woff2',
		]);

		// Verify binary sizes match the fixtures
		expect(archive['static/recursive-latin-400-normal.woff2'].byteLength).toBe(
			staticWoff2Bytes.byteLength,
		);
		expect(
			archive['variable/recursive-latin-full-normal.woff2'].byteLength,
		).toBe(variableWoff2Bytes.byteLength);
		expect(archive['static/recursive-latin-400-normal.ttf'].byteLength).toBe(
			staticTtfBytes.byteLength,
		);

		// LICENSE should be present and non-empty
		expect(new TextDecoder().decode(archive.LICENSE)).toBe('Example License');

		const conditional = await dispatch(
			new Request(url, { headers: { 'If-None-Match': etag ?? '' } }),
		);
		await conditional.settle();
		expect(conditional.response.status).toBe(304);
		expect(conditional.response.headers.get('Cache-Control')).toBe(
			'public, no-cache',
		);
	});

	it('does not expose exact-version download aliases', async () => {
		const builder = installArtifactBuilderMock(testEnv);
		const [staticZipResult, variableZipResult] = await Promise.all([
			dispatch('https://fontsource.test/fonts/recursive@5.0.0/download.zip'),
			dispatch('https://fontsource.test/fonts/recursive:vf@5.0.0/download.zip'),
		]);
		await Promise.all([staticZipResult.settle(), variableZipResult.settle()]);

		expect(staticZipResult.response.status).toBe(404);
		expect(variableZipResult.response.status).toBe(404);
		expect(builder.calls).not.toHaveBeenCalled();
	});

	it('combines independent latest package versions in the canonical download', async () => {
		vi.restoreAllMocks();
		installArtifactBuilderMock(testEnv);
		installUpstreamFetchMock({
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/recursive`]: new Response(
				JSON.stringify({
					versions: [{ version: '5.0.0' }],
				}),
			),
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource-variable/recursive`]:
				new Response(
					JSON.stringify({
						versions: [{ version: '1.1.0' }],
					}),
				),
		});
		clearMetadataCachesForTest();

		const accepted = await dispatch(
			'https://fontsource.test/v1/download/recursive',
		);
		expect(accepted.response.status).toBe(202);
		await accepted.response.json();
		await accepted.settle();

		for (let attempts = 0; attempts < 100; attempts += 1) {
			if (await testEnv.FONTS.head('recursive@5.0.0+vf@1.1.0/download.zip')) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 1));
		}

		const download = await dispatch(
			'https://fontsource.test/v1/download/recursive',
		);
		const archive = unzipSync(
			new Uint8Array(await download.response.arrayBuffer()),
		);
		await download.settle();

		const variableLatest = await dispatch(
			new Request(
				'https://fontsource.test/fonts/recursive:vf@latest/download.zip',
				{ redirect: 'manual' },
			),
		);
		const variableLatestResponse = variableLatest.response;
		await variableLatest.settle();

		expect(download.response.status).toBe(200);
		expect(download.response.headers.get('Content-Type')).toBe(
			'application/zip',
		);
		expect(download.response.headers.get('Content-Disposition')).toBe(
			'attachment; filename="recursive.zip"',
		);
		expect(Object.keys(archive)).toEqual(
			expect.arrayContaining([
				'static/recursive-latin-400-normal.woff2',
				'variable/recursive-latin-full-normal.woff2',
				'LICENSE',
			]),
		);
		expect(
			await testEnv.FONTS.head('recursive@5.0.0+vf@1.1.0/download.zip'),
		).not.toBeNull();

		expect(variableLatestResponse.status).toBe(302);
		expect(variableLatestResponse.headers.get('Location')).toBe(
			'/v1/download/recursive',
		);
	});

	it('serves version metadata and downloads for variable-only packages', async () => {
		vi.restoreAllMocks();
		installArtifactBuilderMock(testEnv);
		installUpstreamFetchMock({
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/recursive`]: new Response(
				'not found',
				{ status: 404 },
			),
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource-variable/recursive`]:
				new Response(JSON.stringify({ versions: [{ version: '1.1.0' }] })),
		});
		clearMetadataCachesForTest();

		const versionResult = await dispatch(
			'https://fontsource.test/v1/version/recursive',
		);
		expect(await versionResult.response.json()).toEqual({
			latest: '',
			static: [],
			latestVariable: '1.1.0',
			variable: ['1.1.0'],
		});
		await versionResult.settle();

		const accepted = await dispatch(
			'https://fontsource.test/v1/download/recursive',
		);
		expect(accepted.response.status).toBe(202);
		expect(await accepted.response.json()).toEqual({
			state: 'building',
			version: '1.1.0',
		});
		await accepted.settle();

		for (let attempts = 0; attempts < 100; attempts += 1) {
			if (await testEnv.FONTS.head('recursive:vf@1.1.0/download.zip')) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 1));
		}

		const download = await dispatch(
			'https://fontsource.test/v1/download/recursive',
		);
		await download.response.arrayBuffer();
		await download.settle();

		expect(download.response.status).toBe(200);
	});

	it('returns a failed asynchronous download build on the next poll', async () => {
		const builder = installArtifactBuilderMock(testEnv, {
			failBuildKeys: ['build:abel@5.0.0:download'],
		});
		const url = 'https://fontsource.test/v1/download/abel';

		const accepted = await dispatch(url);
		await accepted.response.json();
		await accepted.settle();
		expect(accepted.response.status).toBe(202);

		await new Promise((resolve) => setTimeout(resolve, 0));
		const failed = await dispatch(url);
		const body = (await failed.response.json()) as { error: string };
		await failed.settle();

		expect(failed.response.status).toBe(502);
		expect(body.error).toContain(
			'Mocked builder failure for build:abel@5.0.0:download',
		);
		expect(builder.calls).toHaveBeenCalledTimes(1);
	});

	it('redirects variable latest CDN zip aliases to the canonical download endpoint', async () => {
		const { response, settle } = await dispatch(
			new Request(
				'https://fontsource.test/fonts/recursive:vf@latest/download.zip',
				{ redirect: 'manual' },
			),
		);
		await settle();

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe('/v1/download/recursive');
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('redirects static latest CDN zip aliases to the canonical download endpoint', async () => {
		const { response, settle } = await dispatch(
			new Request('https://fontsource.test/fonts/abel@latest/download.zip', {
				redirect: 'manual',
			}),
		);
		await settle();

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe('/v1/download/abel');
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('builds a cold file once and serves it from R2 afterwards', async () => {
		const builder = installArtifactBuilderMock(testEnv);
		const ttfUrl =
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.ttf';

		// Cold miss triggers build
		const cold = await dispatch(ttfUrl);
		const coldBytes = await cold.response.arrayBuffer();
		await cold.settle();
		expect(cold.response.status).toBe(200);
		expect(coldBytes.byteLength).toBe(staticTtfBytes.byteLength);
		expect(cold.response.headers.get('Content-Type')).toBe('font/ttf');
		expect(cold.response.headers.get('Cache-Control')).toBe(
			'public, max-age=31536000, immutable',
		);

		// Warm hit serves from R2
		const warm = await dispatch(ttfUrl);
		const warmBytes = await warm.response.arrayBuffer();
		await warm.settle();
		expect(warm.response.status).toBe(200);
		expect(warmBytes.byteLength).toBe(staticTtfBytes.byteLength);

		// Conditional request returns 304
		const etag = warm.response.headers.get('ETag');
		expect(etag).toBeTruthy();
		const notModified = await dispatch(
			new Request(ttfUrl, { headers: { 'If-None-Match': etag ?? '' } }),
		);
		await notModified.settle();
		expect(notModified.response.status).toBe(304);

		expect(builder.calls).toHaveBeenCalledTimes(1);
		expect(builder.calls).toHaveBeenCalledWith(
			expect.objectContaining({ mode: 'static' }),
		);
	});

	it('joins concurrent cold requests for different files in one package', async () => {
		const builder = installArtifactBuilderMock(testEnv, { buildDelayMs: 25 });
		const ttfUrl =
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.ttf';
		const woff2Url =
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.woff2';

		const [first, second] = await Promise.all([
			dispatch(ttfUrl),
			dispatch(woff2Url),
		]);
		const firstBytes = await first.response.arrayBuffer();
		const secondBytes = await second.response.arrayBuffer();
		await Promise.all([first.settle(), second.settle()]);

		expect(first.response.status).toBe(200);
		expect(second.response.status).toBe(200);
		expect(firstBytes.byteLength).toBe(staticTtfBytes.byteLength);
		expect(secondBytes.byteLength).toBe(staticWoff2Bytes.byteLength);
		expect(builder.calls).toHaveBeenCalledTimes(1);
	});

	it('builds static and variable packages independently', async () => {
		const builder = installArtifactBuilderMock(testEnv, { buildDelayMs: 25 });
		const [staticResult, variableResult] = await Promise.all([
			dispatch(
				'https://fontsource.test/fonts/recursive@5.0.0/latin-400-normal.woff2',
			),
			dispatch(
				'https://fontsource.test/fonts/recursive:vf@5.0.0/latin-full-normal.woff2',
			),
		]);
		await Promise.all([
			staticResult.response.arrayBuffer(),
			variableResult.response.arrayBuffer(),
		]);
		await Promise.all([staticResult.settle(), variableResult.settle()]);

		expect(staticResult.response.status).toBe(200);
		expect(variableResult.response.status).toBe(200);
		expect(builder.calls).toHaveBeenCalledTimes(2);
		expect(builder.calls.mock.calls.map(([request]) => request)).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ mode: 'static' }),
				expect.objectContaining({ mode: 'variable' }),
			]),
		);
	});

	it('returns 502 when the artifact builder fails', async () => {
		installArtifactBuilderMock(testEnv, {
			failBuildKeys: ['build:abel@5.0.0:static'],
		});
		expect(
			await jsonSnapshot(
				'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.ttf',
			),
		).toMatchSnapshot();
	});

	it('short-circuits unpublished exact-version files before the builder runs', async () => {
		vi.restoreAllMocks();
		const builder = installArtifactBuilderMock(testEnv);
		installUpstreamFetchMock({
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/abel@5.0.0?structure=flat`]:
				new Response(
					JSON.stringify({
						files: [],
					}),
					{ status: 200 },
				),
		});

		const result = await dispatch(
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.woff2',
		);
		const payload = (await result.response.json()) as {
			status: number;
			error: string;
		};
		await result.settle();

		expect(result.response.status).toBe(404);
		expect(payload.error).toBe(
			'Requested file latin-400-normal.woff2 not found for abel@5.0.0',
		);
		expect(builder.calls).not.toHaveBeenCalled();
	});

	it('rejects missing exact package versions before the builder runs', async () => {
		vi.restoreAllMocks();
		const builder = installArtifactBuilderMock(testEnv);
		installUpstreamFetchMock({
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/abel@9.9.9?structure=flat`]:
				new Response('not found', { status: 404 }),
			[`${UPSTREAM_URLS.npmRegistry}/@fontsource/abel/9.9.9`]: new Response(
				'not found',
				{ status: 404 },
			),
		});

		const result = await dispatch(
			'https://fontsource.test/fonts/abel@9.9.9/latin-400-normal.woff2',
		);
		const payload = (await result.response.json()) as {
			status: number;
			error: string;
		};
		await result.settle();

		expect(result.response.status).toBe(404);
		expect(payload.error).toBe('Unable to resolve version "9.9.9"');
		expect(builder.calls).not.toHaveBeenCalled();
	});

	it('falls back to the builder while jsdelivr is behind npm', async () => {
		vi.restoreAllMocks();
		installArtifactBuilderMock(testEnv);
		installUpstreamFetchMock({
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/abel@5.0.0?structure=flat`]:
				new Response('not found', { status: 404 }),
			[`${UPSTREAM_URLS.npmRegistry}/@fontsource/abel/5.0.0`]: new Response(
				JSON.stringify({ version: '5.0.0' }),
			),
		});

		const result = await dispatch(
			'https://fontsource.test/fonts/abel@5.0.0/latin-400-normal.woff2',
		);
		const bytes = await result.response.arrayBuffer();
		await result.settle();

		expect(result.response.status).toBe(200);
		expect(bytes.byteLength).toBe(staticWoff2Bytes.byteLength);
	});

	it('returns 502 when version lookup upstream fails', async () => {
		vi.restoreAllMocks();
		installUpstreamFetchMock({
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/recursive`]: new Response(
				'boom',
				{ status: 500 },
			),
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource-variable/recursive`]:
				new Response('boom', { status: 500 }),
		});
		clearMetadataCachesForTest();
		expect(
			await jsonSnapshot('https://fontsource.test/v1/version/recursive'),
		).toMatchSnapshot();
	});
});
