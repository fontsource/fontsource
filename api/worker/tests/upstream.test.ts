import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	fetchPackageAssetBytes,
	fetchPackageFileList,
	fetchPackageTarball,
	UPSTREAM_URLS,
	UpstreamNotFoundError,
} from '../shared/upstream';

describe('upstream package fetches', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('propagates UpstreamNotFoundError when jsdelivr returns 404 for a package asset', async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(new Response('missing', { status: 404 }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(
			fetchPackageAssetBytes('abel', '5.2.7', 'latin-400-normal.woff2'),
		).rejects.toBeInstanceOf(UpstreamNotFoundError);

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock).toHaveBeenCalledWith(
			`${UPSTREAM_URLS.jsdelivrNpm}/@fontsource/abel@5.2.7/files/abel-latin-400-normal.woff2`,
			expect.anything(),
		);
	});

	it('loads the published package file list from the jsDelivr flat endpoint', async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					files: [
						{ name: '/files/noto-sans-jp-japanese-400-normal.woff2' },
						{ name: '/files/noto-sans-jp-latin-400-normal.woff2' },
						{ name: '/README.md' },
					],
				}),
				{ status: 200 },
			),
		);
		vi.stubGlobal('fetch', fetchMock);

		await expect(
			fetchPackageFileList('noto-sans-jp', '5.2.7'),
		).resolves.toEqual(
			new Set(['japanese-400-normal.woff2', 'latin-400-normal.woff2']),
		);
	});

	it('loads exact npm package tarballs from the registry', async () => {
		const tarball = new Uint8Array([1, 2, 3]);
		const fetchMock = vi.fn().mockResolvedValue(new Response(tarball));
		vi.stubGlobal('fetch', fetchMock);

		const stream = await fetchPackageTarball('recursive', '5.2.8', true);
		await expect(new Response(stream).bytes()).resolves.toEqual(tarball);

		expect(fetchMock).toHaveBeenCalledWith(
			`${UPSTREAM_URLS.npmRegistry}/@fontsource-variable/recursive/-/recursive-5.2.8.tgz`,
			undefined,
		);
	});
});
