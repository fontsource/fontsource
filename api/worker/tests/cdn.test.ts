import { unzipSync, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KV_KEYS, UPSTREAM_URLS } from '../worker/src/constants';
import { clearMetadataCachesForTest } from '../worker/src/features/metadata/store';
import type { SourceFontMetadata } from '../shared/catalog';
import {
	dispatch,
	installArtifactBuilderMock,
	installUpstreamFetchMock,
	jsonSnapshot,
	serializeHeaders,
	setupWorkerTest,
	staticTtfBytes,
	testCatalog,
	staticWoff2Bytes,
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
			'recursive@1.0.0/latin-400-normal.woff2',
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
			'recursive@1.0.0/variable/latin-full-normal.woff2',
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
			'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.woff2';
		await testEnv.FONTS.put(
			'abel@1.0.0/latin-400-normal.woff2',
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
			'abel@1.0.0/latin-400-normal.woff2',
			staticWoff2Bytes,
		);

		const result = await dispatch(
			'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.woff2',
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
				'abel@1.0.0/latin-400-normal.woff2',
				staticWoff2Bytes,
			);
			await testEnv.FONTS.put(
				'recursive@1.0.0/variable/latin-full-normal.woff2',
				variableWoff2Bytes,
			);
			await testEnv.FONTS.put(
				'recursive@1.0.0/download.zip',
				zipSync({
					'static/webfonts/recursive-latin-400-normal.woff2': staticWoff2Bytes,
					'static/webfonts/recursive-latin-400-normal.woff': new Uint8Array([
						1,
					]),
					'static/ttf/recursive-latin-400-normal.ttf': new Uint8Array([2]),
					'variable/webfonts/recursive-latin-mono-normal.woff2':
						variableWoff2Bytes,
					'variable/webfonts/recursive-latin-full-normal.woff2':
						variableWoff2Bytes,
					LICENSE: new TextEncoder().encode('Example License'),
				}),
			);
			await testEnv.FONTS.put(
				'abel@1.0.0/download.zip',
				zipSync({
					'static/webfonts/abel-latin-400-normal.woff2': staticWoff2Bytes,
					'static/webfonts/abel-latin-400-normal.woff': new Uint8Array([1]),
					'static/ttf/abel-latin-400-normal.ttf': new Uint8Array([2]),
					LICENSE: new TextEncoder().encode('Example License'),
				}),
			);
		});

		it('generates correct CSS output', async () => {
			expect(
				await textSnapshot('https://fontsource.test/css/abel@latest/index.css'),
			).toMatchSnapshot();
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
			expect(css).toContain('recursive:vf@1.0.0/');
			expect(css).toContain('.woff2');
		});

		it('uses published variable filenames in CSS for slanted axis combinations', async () => {
			await testEnv.METADATA.put(
				KV_KEYS.catalog,
				JSON.stringify({
					...testCatalog,
					slanted: slantedMetadata,
				}),
			);
			clearMetadataCachesForTest();

			const { response, settle } = await dispatch(
				'https://fontsource.test/css/slanted:vf@1.0.0/index.css',
			);
			const css = await response.text();
			await settle();

			expect(response.status).toBe(200);
			expect(css).toContain('font-style: oblique 0deg 15deg;');
			expect(css).toContain('slanted:vf@1.0.0/latin-full-normal.woff2');
			expect(css).not.toContain('oblique%200deg%2015deg');
		});

		it('builds canonical download zips for slanted variable families', async () => {
			const builder = installArtifactBuilderMock(testEnv);
			await testEnv.METADATA.put(
				KV_KEYS.catalog,
				JSON.stringify({
					...testCatalog,
					slanted: slantedMetadata,
				}),
			);
			clearMetadataCachesForTest();

			const result = await dispatch(
				'https://fontsource.test/fonts/slanted@1.0.0/download.zip',
			);
			const archive = unzipSync(new Uint8Array(await result.response.arrayBuffer()));
			await result.settle();

			expect(result.response.status).toBe(200);
			expect(builder.calls).toHaveBeenCalledTimes(1);
			expect(Object.keys(archive)).toEqual(
				expect.arrayContaining([
					'static/webfonts/slanted-latin-400-normal.woff2',
					'variable/webfonts/slanted-latin-mono-normal.woff2',
					'variable/webfonts/slanted-latin-wght-normal.woff2',
					'variable/webfonts/slanted-latin-slnt-normal.woff2',
					'variable/webfonts/slanted-latin-standard-normal.woff2',
					'variable/webfonts/slanted-latin-full-normal.woff2',
					'LICENSE',
				]),
			);
			expect(Object.keys(archive).some((key) => key.includes('oblique'))).toBe(
				false,
			);
		});

		it('serves static font assets with immutable caching', async () => {
			const url =
				'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.woff2';

			const cold = await dispatch(url);
			const coldBytes = await cold.response.arrayBuffer();
			await cold.settle();
			expect(cold.response.status).toBe(200);
			expect(coldBytes.byteLength).toBe(staticWoff2Bytes.byteLength);
			expect(cold.response.headers.get('Content-Type')).toBe('font/woff2');
			expect(cold.response.headers.get('Cache-Control')).toBe(
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
				'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.woff2';
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

		it('serves zip archives with correct file listings', async () => {
			const recursiveResult = await dispatch(
				'https://fontsource.test/fonts/recursive@1.0.0/download.zip',
			);
			const recursiveArchive = unzipSync(
				new Uint8Array(await recursiveResult.response.arrayBuffer()),
			);
			await recursiveResult.settle();

			const abelResult = await dispatch(
				'https://fontsource.test/fonts/abel@1.0.0/download.zip',
			);
			const abelArchive = unzipSync(
				new Uint8Array(await abelResult.response.arrayBuffer()),
			);
			await abelResult.settle();

			expect({
				recursive: {
					status: recursiveResult.response.status,
					headers: serializeHeaders(recursiveResult.response),
					files: Object.keys(recursiveArchive).sort(),
				},
				abel: {
					status: abelResult.response.status,
					headers: serializeHeaders(abelResult.response),
					files: Object.keys(abelArchive).sort(),
				},
			}).toMatchSnapshot();
		});
	});

	it('produces correct download archive from builder', async () => {
		const builder = installArtifactBuilderMock(testEnv);

		const result = await dispatch(
			'https://fontsource.test/fonts/recursive@1.0.0/download.zip',
		);
		const archive = unzipSync(
			new Uint8Array(await result.response.arrayBuffer()),
		);
		await result.settle();

		expect(result.response.status).toBe(200);
		expect(builder.calls).toHaveBeenCalledTimes(1);

		// Archive should contain static + variable files + LICENSE
		const files = Object.keys(archive).sort();
		expect(files).toEqual([
			'LICENSE',
			'static/ttf/recursive-latin-400-normal.ttf',
			'static/webfonts/recursive-latin-400-normal.woff',
			'static/webfonts/recursive-latin-400-normal.woff2',
			'variable/webfonts/recursive-latin-full-normal.woff2',
			'variable/webfonts/recursive-latin-mono-normal.woff2',
		]);

		// Verify binary sizes match the fixtures
		expect(
			archive['static/webfonts/recursive-latin-400-normal.woff2'].byteLength,
		).toBe(staticWoff2Bytes.byteLength);
		expect(
			archive['variable/webfonts/recursive-latin-full-normal.woff2'].byteLength,
		).toBe(variableWoff2Bytes.byteLength);
		expect(
			archive['static/ttf/recursive-latin-400-normal.ttf'].byteLength,
		).toBe(staticTtfBytes.byteLength);

		// LICENSE should be present and non-empty
		expect(new TextDecoder().decode(archive.LICENSE)).toBe('Example License');
	});

	it('redirects exact variable zip aliases to the shared exact-version archive', async () => {
		const builder = installArtifactBuilderMock(testEnv);
		const [staticZipResult, variableZipResult] = await Promise.all([
			dispatch('https://fontsource.test/fonts/recursive@1.0.0/download.zip'),
			dispatch(
				new Request(
					'https://fontsource.test/fonts/recursive:vf@1.0.0/download.zip',
					{ redirect: 'manual' },
				),
			),
		]);

		const staticZipArchive = unzipSync(
			new Uint8Array(await staticZipResult.response.arrayBuffer()),
		);
		await Promise.all([staticZipResult.settle(), variableZipResult.settle()]);

		// Static zip served directly with built artifacts
		expect(staticZipResult.response.status).toBe(200);
		expect(Object.keys(staticZipArchive)).toContain('LICENSE');

		// Variable zip alias redirects to the shared archive
		expect(variableZipResult.response.status).toBe(302);
		expect(variableZipResult.response.headers.get('Location')).toBe(
			'https://fontsource.test/fonts/recursive@1.0.0/download.zip',
		);

		// Only one build was triggered
		expect(builder.calls).toHaveBeenCalledTimes(1);
	});

	it('redirects exact variable zip aliases for static families to the shared archive route', async () => {
		const { response, settle } = await dispatch(
			new Request('https://fontsource.test/fonts/abel:vf@1.0.0/download.zip', {
				redirect: 'manual',
			}),
		);
		await settle();

		expect(response.status).toBe(302);
		expect(response.headers.get('Location')).toBe(
			'https://fontsource.test/fonts/abel@1.0.0/download.zip',
		);
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('stores HTTP metadata on built binaries and download archives', async () => {
		const builder = installArtifactBuilderMock(testEnv);
		const zipResult = await dispatch(
			'https://fontsource.test/fonts/recursive@1.0.0/download.zip',
		);
		await zipResult.response.arrayBuffer();
		await zipResult.settle();

		const pick = (obj: R2Object | null) => ({
			cacheControl: obj?.httpMetadata?.cacheControl ?? '',
			contentDisposition: obj?.httpMetadata?.contentDisposition ?? '',
			contentType: obj?.httpMetadata?.contentType ?? '',
		});

		expect({
			buildCalls: builder.calls.mock.calls.length,
			zip: pick(await testEnv.FONTS.head('recursive@1.0.0/download.zip')),
			static: pick(
				await testEnv.FONTS.head('recursive@1.0.0/latin-400-normal.woff2'),
			),
			variable: pick(
				await testEnv.FONTS.head(
					'recursive@1.0.0/variable/latin-full-normal.woff2',
				),
			),
		}).toMatchSnapshot();
	});

	it('serves canonical family zips directly and redirects floating variable zip aliases', async () => {
		vi.restoreAllMocks();
		installUpstreamFetchMock({
			[`${UPSTREAM_URLS.jsdelivrPackage}/@fontsource/recursive`]: new Response(
				JSON.stringify({
					versions: [{ version: '1.0.0' }],
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
		await testEnv.FONTS.put(
			'recursive@1.0.0/download.zip',
			zipSync({
				'static/webfonts/recursive-latin-400-normal.woff2': staticWoff2Bytes,
				LICENSE: new TextEncoder().encode('static latest'),
			}),
		);
		await testEnv.FONTS.put(
			'recursive@1.1.0/download.zip',
			zipSync({
				'variable/webfonts/recursive-latin-full-normal.woff2':
					variableWoff2Bytes,
				LICENSE: new TextEncoder().encode('variable latest'),
			}),
		);

		const staticLatest = await dispatch(
			'https://fontsource.test/v1/download/recursive',
		);
		const staticLatestResponse = staticLatest.response;
		const staticLatestArchive = unzipSync(
			new Uint8Array(await staticLatestResponse.arrayBuffer()),
		);
		await staticLatest.settle();

		const variableLatest = await dispatch(
			new Request(
				'https://fontsource.test/fonts/recursive:vf@latest/download.zip',
				{ redirect: 'manual' },
			),
		);
		const variableLatestResponse = variableLatest.response;
		await variableLatest.settle();

		expect(staticLatestResponse.status).toBe(200);
		expect(staticLatestResponse.headers.get('Content-Type')).toBe(
			'application/zip',
		);
		expect(new TextDecoder().decode(staticLatestArchive.LICENSE)).toBe(
			'static latest',
		);

		expect(variableLatestResponse.status).toBe(302);
		expect(variableLatestResponse.headers.get('Location')).toBe(
			'https://fontsource.test/v1/download/recursive',
		);
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
		expect(response.headers.get('Location')).toBe(
			'https://fontsource.test/v1/download/recursive',
		);
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
		expect(response.headers.get('Location')).toBe(
			'https://fontsource.test/v1/download/abel',
		);
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
	});

	it('triggers one version build on cold ttf miss and serves cached files afterwards', async () => {
		const builder = installArtifactBuilderMock(testEnv);
		const ttfUrl =
			'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.ttf';

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

		// Only one build was triggered
		expect(builder.calls).toHaveBeenCalledTimes(1);
	});

	it('joins concurrent cold requests for the same build key', async () => {
		const builder = installArtifactBuilderMock(testEnv);
		const url = 'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.ttf';

		const [first, second] = await Promise.all([dispatch(url), dispatch(url)]);
		const firstBytes = await first.response.arrayBuffer();
		const secondBytes = await second.response.arrayBuffer();
		await Promise.all([first.settle(), second.settle()]);

		expect(first.response.status).toBe(200);
		expect(second.response.status).toBe(200);
		expect(firstBytes.byteLength).toBe(staticTtfBytes.byteLength);
		expect(secondBytes.byteLength).toBe(staticTtfBytes.byteLength);
		expect(builder.calls).toHaveBeenCalledTimes(1);
	});

	it('returns 502 when the artifact builder fails', async () => {
		installArtifactBuilderMock(testEnv, {
			failBuildKeys: ['build:abel@1.0.0'],
		});
		expect(
			await jsonSnapshot(
				'https://fontsource.test/fonts/abel@1.0.0/latin-400-normal.ttf',
			),
		).toMatchSnapshot();
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
