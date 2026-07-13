import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { KV_KEYS, UPSTREAM_URLS } from '../worker/src/constants';
import {
	dispatch,
	installUpstreamFetchMock,
	setupWorkerTest,
	staticMetadata,
	staticWoff2Bytes,
	testCatalog,
	testEnv,
	variableWoff2Bytes,
} from './helpers';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

const readUint32 = (bytes: Uint8Array, offset: number): number =>
	new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
		offset,
	);

describe('font Open Graph route', () => {
	beforeEach(async () => {
		await setupWorkerTest();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('renders a cacheable 1200×630 PNG with conditional request support', async () => {
		const first = await dispatch('https://fontsource.test/og/fonts/abel');
		const bytes = new Uint8Array(await first.response.arrayBuffer());
		await first.settle();

		expect(first.response.status).toBe(200);
		expect(first.response.headers.get('Content-Type')).toBe('image/png');
		expect(first.response.headers.get('Cache-Control')).toBe(
			'public, max-age=300',
		);
		expect(first.response.headers.get('Last-Modified')).toBe(
			'Mon, 01 Jan 2024 00:00:00 GMT',
		);
		expect(Array.from(bytes.subarray(0, 8))).toEqual(PNG_SIGNATURE);
		expect(readUint32(bytes, 16)).toBe(1200);
		expect(readUint32(bytes, 20)).toBe(630);

		const etag = first.response.headers.get('ETag');
		expect(etag).toBeTruthy();

		const second = await dispatch(
			new Request('https://fontsource.test/og/fonts/abel', {
				headers: { 'If-None-Match': etag ?? '' },
			}),
		);
		await second.settle();

		expect(second.response.status).toBe(304);
		expect(second.response.headers.get('Cache-Control')).toBe(
			'public, max-age=300',
		);
	});

	it('uses the stable fallback when the preview font cannot be loaded', async () => {
		const fontUrl = `${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/abel@latest/files/abel-latin-400-normal.woff2`;
		installUpstreamFetchMock({
			[fontUrl]: new Response('missing', { status: 404 }),
		});
		vi.spyOn(console, 'error').mockImplementation(() => undefined);

		const result = await dispatch('https://fontsource.test/og/fonts/abel');
		const bytes = new Uint8Array(await result.response.arrayBuffer());
		await result.settle();

		expect(result.response.status).toBe(200);
		expect(Array.from(bytes.subarray(0, 8))).toEqual(PNG_SIGNATURE);
	});

	it('renders numeric family names without font fallback', async () => {
		const id = 'fusion-pixel-10px-proportional-jp';
		const metadata = {
			...staticMetadata,
			id,
			family: 'Fusion Pixel 10px Proportional JP',
			lastModified: '2024-01-04',
		};
		await testEnv.METADATA.put(
			KV_KEYS.catalog,
			JSON.stringify({ ...testCatalog, [id]: metadata }),
		);
		const fontUrl = `${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/${id}@latest/files/${id}-latin-400-normal.woff2`;
		installUpstreamFetchMock({
			[fontUrl]: new Response(staticWoff2Bytes),
		});
		const errorSpy = vi
			.spyOn(console, 'error')
			.mockImplementation(() => undefined);

		const result = await dispatch(`https://fontsource.test/og/fonts/${id}`);
		const bytes = new Uint8Array(await result.response.arrayBuffer());
		await result.settle();

		expect(result.response.status).toBe(200);
		expect(Array.from(bytes.subarray(0, 8))).toEqual(PNG_SIGNATURE);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('isolates concurrent font renders', async () => {
		const firstId = 'concurrent-static';
		const secondId = 'concurrent-variable';
		const metadata = {
			...staticMetadata,
			family: 'Concurrent Preview',
			lastModified: '2024-01-06',
		};
		await testEnv.METADATA.put(
			KV_KEYS.catalog,
			JSON.stringify({
				...testCatalog,
				[firstId]: { ...metadata, id: firstId },
				[secondId]: { ...metadata, id: secondId },
			}),
		);
		const firstUrl = `${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/${firstId}@latest/files/${firstId}-latin-400-normal.woff2`;
		const secondUrl = `${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/${secondId}@latest/files/${secondId}-latin-400-normal.woff2`;
		installUpstreamFetchMock({
			[firstUrl]: new Response(staticWoff2Bytes),
			[secondUrl]: new Response(variableWoff2Bytes),
		});

		const [first, second] = await Promise.all([
			dispatch(`https://fontsource.test/og/fonts/${firstId}`),
			dispatch(`https://fontsource.test/og/fonts/${secondId}`),
		]);
		const [firstBytes, secondBytes] = await Promise.all([
			first.response.arrayBuffer().then((bytes) => new Uint8Array(bytes)),
			second.response.arrayBuffer().then((bytes) => new Uint8Array(bytes)),
		]);
		await Promise.all([first.settle(), second.settle()]);

		expect(first.response.status).toBe(200);
		expect(second.response.status).toBe(200);
		expect(firstBytes).not.toEqual(secondBytes);
	});

	it('returns 404 for an unknown font', async () => {
		const result = await dispatch('https://fontsource.test/og/fonts/missing');
		const body = await result.response.json();
		await result.settle();

		expect(result.response.status).toBe(404);
		expect(result.response.headers.get('Cache-Control')).toBe(
			'public, max-age=60',
		);
		expect(body).toEqual({
			status: 404,
			error: 'Not Found. Font "missing" does not exist.',
		});
	});
});
