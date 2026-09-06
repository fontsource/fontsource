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
	toResponse,
	variableWoff2Bytes,
} from './helpers';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const REGISTRY_REVISION = '1'.repeat(40);
const SOURCE_SHA256 = '2'.repeat(64);

const seedRegistryFamilies = async (
	families: ReadonlyArray<{ id: string; family: string }>,
): Promise<void> => {
	const existing = await testEnv.REGISTRY.list();
	await Promise.all(
		existing.objects.map(({ key }) => testEnv.REGISTRY.delete(key)),
	);
	await testEnv.REGISTRY.put(
		'current.json',
		JSON.stringify({
			schemaVersion: 1,
			registryRevision: REGISTRY_REVISION,
		}),
	);
	await Promise.all(
		families.map(({ id, family }) =>
			testEnv.REGISTRY.put(
				`snapshots/${REGISTRY_REVISION}/api/families/${id}.json`,
				JSON.stringify({
					id,
					family,
					provider: 'google',
					status: 'active',
					classifications: ['sans-serif'],
					tags: [],
					sourceModified: '2024-01-01',
					axes: [],
					previewSubset: 'latin',
					sampleText: { short: family },
					license: {
						id: 'OFL-1.1',
						url: 'https://openfontlicense.org',
						text: 'Test license',
					},
					languages: [],
					provenance: { type: 'registry' },
					previewSource: SOURCE_SHA256,
					distribution: {
						static: [
							{
								weight: 400,
								style: 'normal',
								source: SOURCE_SHA256,
							},
						],
						characters: {
							type: 'subsets',
							defaultSubset: 'latin',
							subsets: [{ id: 'latin', definition: 'latin' }],
							slicing: 'japanese-web',
						},
					},
					sources: [
						{
							sha256: SOURCE_SHA256,
							filename: `${id}.ttf`,
							path: `${id}.ttf`,
							format: 'ttf',
							size: 1,
							downloadUrl: `/v1/registry/sources/${SOURCE_SHA256}`,
							capabilitiesUrl: `/v1/registry/sources/${SOURCE_SHA256}/capabilities`,
							fontVersion: null,
							glyphCount: 1,
							codepointCount: 1,
							style: 'normal',
							type: 'static',
							weight: 400,
						},
					],
				}),
			),
		),
	);
};

const readUint32 = (bytes: Uint8Array, offset: number): number =>
	new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(
		offset,
	);

describe('font Open Graph route', () => {
	beforeEach(async () => {
		await setupWorkerTest();
		await seedRegistryFamilies([
			{ id: staticMetadata.id, family: staticMetadata.family },
		]);
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
		await seedRegistryFamilies([
			{ id: staticMetadata.id, family: staticMetadata.family },
			{ id, family: metadata.family },
		]);
		const fontUrl = `${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/${id}@latest/files/${id}-latin-400-normal.woff2`;
		installUpstreamFetchMock({
			[fontUrl]: toResponse(staticWoff2Bytes),
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
		await seedRegistryFamilies([
			{ id: firstId, family: metadata.family },
			{ id: secondId, family: metadata.family },
		]);
		const firstUrl = `${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/${firstId}@latest/files/${firstId}-latin-400-normal.woff2`;
		const secondUrl = `${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/${secondId}@latest/files/${secondId}-latin-400-normal.woff2`;
		installUpstreamFetchMock({
			[firstUrl]: toResponse(staticWoff2Bytes),
			[secondUrl]: toResponse(variableWoff2Bytes),
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
