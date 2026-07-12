import { gzipSync, unzipSync } from 'fflate';
import { packTar } from 'modern-tar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildVersionRequest } from '../shared/build';
import { resolveFontPackageManifest } from '../shared/font-package-manifest';
import {
	staticMetadata,
	staticTtfBytes,
	staticWoff2Bytes,
	staticWoffBytes,
	testCatalog,
	variableAxes,
	variableMetadata,
	variableWoff2Bytes,
} from './helpers';

const {
	putObject,
	fetchPackageAssetBytes,
	fetchPackageFileList,
	fetchPackageTarball,
	convertFont,
	destroy,
	createFontContext,
} = vi.hoisted(() => {
	const destroy = vi.fn();

	return {
		putObject: vi.fn(),
		fetchPackageAssetBytes: vi.fn(),
		fetchPackageFileList: vi.fn(),
		fetchPackageTarball: vi.fn(),
		convertFont: vi.fn(),
		destroy,
		createFontContext: vi.fn(() => ({ destroy })),
	};
});

vi.mock('../container/src/r2', () => ({
	putObject,
}));

vi.mock('../shared/upstream', async () => {
	const actual =
		await vi.importActual<typeof import('../shared/upstream')>(
			'../shared/upstream',
		);

	return {
		...actual,
		fetchPackageAssetBytes,
		fetchPackageFileList,
		fetchPackageTarball,
	};
});

vi.mock('@fontsource-utils/core', async () => {
	const actual = await vi.importActual<typeof import('@fontsource-utils/core')>(
		'@fontsource-utils/core',
	);

	return {
		...actual,
		convertFont,
		createFontContext,
	};
});

describe('container artifact builder', () => {
	const createPackageTarball = async (
		id: string,
		isVariable = false,
		publishedFiles?: ReadonlySet<string>,
	): Promise<Uint8Array> => {
		const metadata = testCatalog[id];
		if (!metadata) {
			throw new Error(`Missing test metadata for ${id}`);
		}

		const manifest = resolveFontPackageManifest(
			metadata,
			isVariable ? metadata.variable || undefined : undefined,
		);
		const entries = isVariable ? manifest.variable : manifest.static;
		const files: Array<[string, Uint8Array]> = [];

		for (const filename of new Set(
			entries.map((item) => item.sourceFilename),
		)) {
			if (publishedFiles && !publishedFiles.has(filename)) {
				continue;
			}

			const bytes = isVariable
				? variableWoff2Bytes
				: filename.endsWith('.woff2')
					? staticWoff2Bytes
					: staticWoffBytes;
			files.push([`package/files/${id}-${filename}`, bytes]);
		}

		if (!isVariable) {
			files.push([
				'package/LICENSE',
				new TextEncoder().encode('Example License'),
			]);
		}

		return gzipSync(
			await packTar(
				files.map(([name, body]) => ({
					header: { name, size: body.byteLength, type: 'file' },
					body,
				})),
			),
		);
	};

	const tarballStream = (tarball: Uint8Array): ReadableStream<Uint8Array> => {
		const body = new Response(tarball).body;
		if (!body) {
			throw new Error('Missing test tarball body');
		}

		return body;
	};

	beforeEach(() => {
		putObject.mockReset();
		fetchPackageAssetBytes.mockReset();
		fetchPackageFileList.mockReset();
		fetchPackageTarball.mockReset();
		convertFont.mockReset();
		destroy.mockReset();
		createFontContext.mockClear();

		fetchPackageFileList.mockImplementation(
			async (id, _version, isVariable = false) => {
				if (id === variableMetadata.id && isVariable) {
					return new Set(
						resolveFontPackageManifest(
							variableMetadata,
							variableAxes,
						).variable.map((item) => item.sourceFilename),
					);
				}

				if (id === testCatalog.familypack.id) {
					return new Set(
						resolveFontPackageManifest(testCatalog.familypack).static.map(
							(item) => item.sourceFilename,
						),
					);
				}

				return new Set(
					resolveFontPackageManifest(staticMetadata).static.map(
						(item) => item.sourceFilename,
					),
				);
			},
		);
		fetchPackageTarball.mockImplementation(
			async (id: string, _version: string, isVariable = false) => {
				return tarballStream(await createPackageTarball(id, isVariable));
			},
		);
		fetchPackageAssetBytes.mockImplementation(
			async (
				_id: string,
				_version: string,
				file: string,
				isVariable = false,
			) => {
				if (isVariable) {
					return variableWoff2Bytes;
				}

				if (file.endsWith('.woff2')) {
					return staticWoff2Bytes;
				}

				if (file.endsWith('.woff')) {
					return staticWoffBytes;
				}

				throw new Error(`Unexpected upstream asset ${file}`);
			},
		);
		convertFont.mockResolvedValue([{ data: staticTtfBytes }]);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('builds only the requested static file in file mode', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const request: BuildVersionRequest = {
			mode: 'file',
			tag: {
				id: staticMetadata.id,
				version: '1.0.0',
			},
			metadata: staticMetadata,
			target: {
				file: 'latin-400-normal.woff2',
				isVariable: false,
			},
		};

		await expect(buildArtifacts(request)).resolves.toBe(1);

		expect(convertFont).not.toHaveBeenCalled();
		expect(putObject).toHaveBeenCalledTimes(1);
		expect(putObject).toHaveBeenCalledWith(
			'abel@1.0.0/latin-400-normal.woff2',
			staticWoff2Bytes,
			expect.objectContaining({
				contentType: 'font/woff2',
			}),
		);
	});

	it('builds only the requested variable file in file mode', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const request: BuildVersionRequest = {
			mode: 'file',
			tag: {
				id: variableMetadata.id,
				version: '1.0.0',
			},
			metadata: variableMetadata,
			target: {
				file: 'latin-full-normal.woff2',
				isVariable: true,
			},
		};

		await expect(buildArtifacts(request)).resolves.toBe(1);

		expect(convertFont).not.toHaveBeenCalled();
		expect(putObject).toHaveBeenCalledTimes(1);
		expect(putObject).toHaveBeenCalledWith(
			'recursive@1.0.0/variable/latin-full-normal.woff2',
			variableWoff2Bytes,
			expect.objectContaining({
				contentType: 'font/woff2',
			}),
		);
	});

	it('converts static ttf files only when the requested file is ttf', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const request: BuildVersionRequest = {
			mode: 'file',
			tag: {
				id: staticMetadata.id,
				version: '1.0.0',
			},
			metadata: staticMetadata,
			target: {
				file: 'latin-400-normal.ttf',
				isVariable: false,
			},
		};

		await expect(buildArtifacts(request)).resolves.toBe(1);

		expect(fetchPackageAssetBytes).toHaveBeenCalledTimes(1);
		expect(fetchPackageAssetBytes).toHaveBeenCalledWith(
			'abel',
			'1.0.0',
			'latin-400-normal.woff',
		);
		expect(convertFont).toHaveBeenCalledTimes(1);
		expect(putObject).toHaveBeenCalledTimes(1);
		expect(putObject).toHaveBeenCalledWith(
			'abel@1.0.0/latin-400-normal.ttf',
			staticTtfBytes,
			expect.objectContaining({
				contentType: 'font/ttf',
			}),
		);
	});

	it('assembles download entries from the correct built artifacts', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const request: BuildVersionRequest = {
			mode: 'download',
			staticVersion: '1.0.0',
			metadata: testCatalog.familypack,
		};

		await expect(buildArtifacts(request)).resolves.toBe(13);

		const zipPut = putObject.mock.calls.find(
			([key]) => key === 'familypack@1.0.0/download.zip',
		);
		expect(zipPut).toBeDefined();

		const archive = unzipSync(zipPut?.[1] as Uint8Array);
		expect(Object.keys(archive).sort()).toEqual([
			'LICENSE',
			'static/familypack-latin-400-normal.ttf',
			'static/familypack-latin-400-normal.woff',
			'static/familypack-latin-400-normal.woff2',
			'static/familypack-latin-700-normal.ttf',
			'static/familypack-latin-700-normal.woff',
			'static/familypack-latin-700-normal.woff2',
			'static/familypack-latin-ext-400-normal.ttf',
			'static/familypack-latin-ext-400-normal.woff',
			'static/familypack-latin-ext-400-normal.woff2',
			'static/familypack-latin-ext-700-normal.ttf',
			'static/familypack-latin-ext-700-normal.woff',
			'static/familypack-latin-ext-700-normal.woff2',
		]);
		expect(archive['static/familypack-latin-400-normal.woff2']).toEqual(
			staticWoff2Bytes,
		);
		expect(archive['static/familypack-latin-ext-700-normal.woff']).toEqual(
			staticWoffBytes,
		);
		expect(archive['static/familypack-latin-700-normal.ttf']).toEqual(
			staticTtfBytes,
		);
		expect(fetchPackageAssetBytes).not.toHaveBeenCalled();
		expect(fetchPackageFileList).not.toHaveBeenCalled();
		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'familypack',
			'1.0.0',
			false,
		);
	});

	it('combines exact static and variable package versions', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');

		await buildArtifacts({
			mode: 'download',
			staticVersion: '1.0.0',
			variableVersion: '2.0.0',
			metadata: variableMetadata,
		});

		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'recursive',
			'1.0.0',
			false,
		);
		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'recursive',
			'2.0.0',
			true,
		);

		const zipPut = putObject.mock.calls.find(
			([key]) => key === 'recursive@1.0.0+vf@2.0.0/download.zip',
		);
		const archive = unzipSync(zipPut?.[1] as Uint8Array);
		expect(Object.keys(archive)).toEqual(
			expect.arrayContaining([
				'static/recursive-latin-400-normal.woff2',
				'variable/recursive-latin-full-normal.woff2',
				'LICENSE',
			]),
		);
	});

	it('keeps the download available when an individual warm upload fails', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
		putObject
			.mockResolvedValueOnce(undefined)
			.mockRejectedValueOnce(new Error('artifact upload failed'));

		await expect(
			buildArtifacts({
				mode: 'download',
				staticVersion: '1.0.0',
				metadata: staticMetadata,
			}),
		).resolves.toBeGreaterThan(1);

		expect(
			putObject.mock.calls.some(([key]) => key === 'abel@1.0.0/download.zip'),
		).toBe(true);
		expect(errorLog).toHaveBeenCalledWith(
			expect.stringContaining('failed to warm 1/'),
			expect.arrayContaining([expect.any(Error)]),
		);
		errorLog.mockRestore();
	});

	it('publishes the download before individual warming completes', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const releaseUploads: Array<() => void> = [];
		putObject.mockImplementation(async (key: string) => {
			if (key === 'abel@1.0.0/download.zip') {
				return;
			}

			await new Promise<void>((resolve) => {
				releaseUploads.push(resolve);
			});
		});

		let finished = false;
		const build = buildArtifacts({
			mode: 'download',
			staticVersion: '1.0.0',
			metadata: staticMetadata,
		}).finally(() => {
			finished = true;
		});

		await vi.waitFor(() => {
			expect(
				putObject.mock.calls.some(([key]) => key === 'abel@1.0.0/download.zip'),
			).toBe(true);
			expect(releaseUploads.length).toBeGreaterThan(0);
		});
		expect(finished).toBe(false);

		for (const release of releaseUploads) {
			release();
		}
		await expect(build).resolves.toBe(4);
	});

	it('filters download artifacts to files published for that version', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		fetchPackageTarball.mockResolvedValueOnce(
			tarballStream(
				await createPackageTarball(
					testCatalog.familypack.id,
					false,
					new Set([
						'latin-400-normal.woff2',
						'latin-400-normal.woff',
						'latin-700-normal.woff2',
						'latin-700-normal.woff',
					]),
				),
			),
		);

		const request: BuildVersionRequest = {
			mode: 'download',
			staticVersion: '1.0.0',
			metadata: testCatalog.familypack,
		};

		await expect(buildArtifacts(request)).resolves.toBe(7);

		const zipPut = putObject.mock.calls.find(
			([key]) => key === 'familypack@1.0.0/download.zip',
		);
		expect(zipPut).toBeDefined();

		const archive = unzipSync(zipPut?.[1] as Uint8Array);
		expect(Object.keys(archive).sort()).toEqual([
			'LICENSE',
			'static/familypack-latin-400-normal.ttf',
			'static/familypack-latin-400-normal.woff',
			'static/familypack-latin-400-normal.woff2',
			'static/familypack-latin-700-normal.ttf',
			'static/familypack-latin-700-normal.woff',
			'static/familypack-latin-700-normal.woff2',
		]);
	});
});
