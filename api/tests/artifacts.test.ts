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
	variableMetadata,
	variableWoff2Bytes,
} from './helpers';

const {
	putObject,
	fetchPackageTarball,
	convertFont,
	destroy,
	createFontContext,
} = vi.hoisted(() => {
	const destroy = vi.fn();

	return {
		putObject: vi.fn(),
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

		files.push([
			'package/LICENSE',
			new TextEncoder().encode('Example License'),
		]);

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
		fetchPackageTarball.mockReset();
		convertFont.mockReset();
		destroy.mockReset();
		createFontContext.mockClear();

		fetchPackageTarball.mockImplementation(
			async (id: string, _version: string, isVariable = false) => {
				return tarballStream(await createPackageTarball(id, isVariable));
			},
		);
		convertFont.mockResolvedValue([{ data: staticTtfBytes }]);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('builds every published static artifact in package mode', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		fetchPackageTarball.mockResolvedValueOnce(
			tarballStream(
				await createPackageTarball(
					testCatalog.familypack.id,
					false,
					new Set(['latin-400-normal.woff2', 'latin-400-normal.woff']),
				),
			),
		);
		const request: BuildVersionRequest = {
			mode: 'static',
			tag: {
				id: testCatalog.familypack.id,
				version: '1.0.0',
			},
			metadata: testCatalog.familypack,
		};

		await expect(buildArtifacts(request)).resolves.toBe(3);

		expect(convertFont).toHaveBeenCalledTimes(1);
		expect(convertFont).toHaveBeenCalledWith(
			expect.anything(),
			staticWoff2Bytes,
			['ttf'],
			'familypack-latin-400-normal.woff2',
		);
		expect(putObject.mock.calls.map(([key]) => key).sort()).toEqual([
			'familypack@1.0.0/latin-400-normal.ttf',
			'familypack@1.0.0/latin-400-normal.woff',
			'familypack@1.0.0/latin-400-normal.woff2',
		]);
		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'familypack',
			'1.0.0',
			false,
		);
	});

	it('builds every published variable artifact in package mode', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const request: BuildVersionRequest = {
			mode: 'variable',
			tag: {
				id: variableMetadata.id,
				version: '1.0.0',
			},
			metadata: variableMetadata,
		};

		const variableManifest = resolveFontPackageManifest(
			variableMetadata,
			variableMetadata.variable || undefined,
		).variable;
		await expect(buildArtifacts(request)).resolves.toBe(
			variableManifest.length,
		);

		expect(convertFont).not.toHaveBeenCalled();
		expect(putObject.mock.calls.map(([key]) => key).sort()).toEqual(
			variableManifest
				.map((entry) => `recursive@1.0.0/variable/${entry.filename}`)
				.sort(),
		);
		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'recursive',
			'1.0.0',
			true,
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
		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'familypack',
			'1.0.0',
			false,
		);
	});

	it('combines exact package versions using published variable filenames', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const fallbackFilename = 'fallback-mono-normal.woff2';
		const variableTarball = gzipSync(
			await packTar([
				{
					header: {
						name: `package/files/recursive-${fallbackFilename}`,
						size: variableWoff2Bytes.byteLength,
						type: 'file',
					},
					body: variableWoff2Bytes,
				},
			]),
		);
		fetchPackageTarball.mockImplementation(
			async (id: string, _version: string, isVariable = false) =>
				tarballStream(
					isVariable ? variableTarball : await createPackageTarball(id, false),
				),
		);

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
				`variable/recursive-${fallbackFilename}`,
				'LICENSE',
			]),
		);
	});

	it('builds downloads from a variable package without a static package', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');

		await buildArtifacts({
			mode: 'download',
			variableVersion: '2.0.0',
			metadata: variableMetadata,
		});

		const zipPut = putObject.mock.calls.find(
			([key]) => key === 'recursive:vf@2.0.0/download.zip',
		);
		const archive = unzipSync(zipPut?.[1] as Uint8Array);
		expect(Object.keys(archive)).toContain('LICENSE');
		expect(Object.keys(archive).some((key) => key.startsWith('static/'))).toBe(
			false,
		);
		expect(
			Object.keys(archive).some((key) => key.startsWith('variable/')),
		).toBe(true);
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
