import { readFileSync } from 'node:fs';
import { gzipSync, unzipSync } from 'fflate';
import { packTar } from 'modern-tar';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildVersionRequest } from '../shared/build';
import { logger } from '../shared/logger';
import { toResponseBody } from '../shared/response';
import {
	staticMetadata,
	testCatalog,
	variableMetadata,
} from '../tests/fixtures/metadata';
import { publishedFiles } from '../tests/fixtures/published-files';
import { buildArtifacts } from './src/artifacts';

const staticWoff2Bytes = new Uint8Array(
	readFileSync(
		new URL(
			'../tests/fixtures/fonts/abel-latin-400-normal.woff2',
			import.meta.url,
		),
	),
);
const staticWoffBytes = new Uint8Array(
	readFileSync(
		new URL(
			'../tests/fixtures/fonts/abel-latin-400-normal.woff',
			import.meta.url,
		),
	),
);
const variableWoff2Bytes = new Uint8Array(
	readFileSync(
		new URL(
			'../tests/fixtures/fonts/recursive-latin-full-normal.woff2',
			import.meta.url,
		),
	),
);
const cffWoff2Bytes = new Uint8Array(
	readFileSync(
		new URL('../tests/fixtures/fonts/synthetic-cff.woff2', import.meta.url),
	),
);

const { putObject, fetchPackageTarball } = vi.hoisted(() => ({
	putObject: vi.fn(),
	fetchPackageTarball: vi.fn(),
}));

vi.mock('./src/r2', () => ({ putObject }));
vi.mock('../shared/upstream', async (importOriginal) => ({
	...(await importOriginal<typeof import('../shared/upstream')>()),
	fetchPackageTarball,
}));

describe('container artifact builder', () => {
	const createPackageTarball = async (
		id: string,
		isVariable = false,
		filenames = publishedFiles[
			`@fontsource${isVariable ? '-variable' : ''}/${id}`
		],
		staticWoff2: Uint8Array = staticWoff2Bytes,
	): Promise<Uint8Array> => {
		if (!filenames) throw new Error(`Missing published files for ${id}`);
		const files: Array<[string, Uint8Array]> = [];

		for (const filename of filenames) {
			const bytes = isVariable
				? variableWoff2Bytes
				: filename.endsWith('.woff2')
					? staticWoff2
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
		const body = new Response(toResponseBody(tarball)).body;
		if (!body) {
			throw new Error('Missing test tarball body');
		}

		return body;
	};

	beforeEach(() => {
		putObject.mockReset();
		fetchPackageTarball.mockReset();

		fetchPackageTarball.mockImplementation(
			async (id: string, _version: string, isVariable = false) => {
				return tarballStream(await createPackageTarball(id, isVariable));
			},
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('builds every published static artifact in package mode', async () => {
		fetchPackageTarball.mockResolvedValueOnce(
			tarballStream(
				await createPackageTarball(testCatalog.familypack.id, false, [
					'latin-400-normal.woff2',
					'latin-400-normal.woff',
				]),
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

	it('publishes CFF as OTF and includes it in downloads', async () => {
		const tarball = await createPackageTarball(
			'abel',
			false,
			['latin-400-normal.woff2'],
			cffWoff2Bytes,
		);
		fetchPackageTarball.mockImplementation(async () => tarballStream(tarball));

		await buildArtifacts({
			mode: 'static',
			tag: { id: 'abel', version: '1.0.0' },
			metadata: staticMetadata,
		});
		expect(putObject.mock.calls.map(([key]) => key).sort()).toEqual([
			'abel@1.0.0/latin-400-normal.otf',
			'abel@1.0.0/latin-400-normal.woff2',
		]);
		const otfPut = putObject.mock.calls.find(([key]) => key.endsWith('.otf'));
		expect(otfPut?.[1].slice(0, 4)).toEqual(
			new Uint8Array([0x4f, 0x54, 0x54, 0x4f]),
		);
		expect(otfPut?.[2].contentType).toBe('font/otf');
		putObject.mockClear();
		await buildArtifacts({
			mode: 'download',
			staticVersion: '1.0.0',
			metadata: staticMetadata,
		});
		const zipPut = putObject.mock.calls.find(([key]) =>
			key.endsWith('/download.zip'),
		);
		const archive = unzipSync(zipPut?.[1] as Uint8Array);
		expect(Object.keys(archive)).toContain('static/abel-latin-400-normal.otf');
		expect(Object.keys(archive)).not.toContain(
			'static/abel-latin-400-normal.ttf',
		);
	});

	it('builds every published variable artifact in package mode', async () => {
		const request: BuildVersionRequest = {
			mode: 'variable',
			tag: {
				id: variableMetadata.id,
				version: '1.0.0',
			},
			metadata: variableMetadata,
		};

		await expect(buildArtifacts(request)).resolves.toBe(2);

		expect(putObject.mock.calls.map(([key]) => key).sort()).toEqual([
			'recursive@1.0.0/variable/latin-full-normal.woff2',
			'recursive@1.0.0/variable/latin-mono-normal.woff2',
		]);
		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'recursive',
			'1.0.0',
			true,
		);
	});

	it('assembles download entries from the correct built artifacts', async () => {
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
		expect(Object.keys(archive).sort()).toMatchSnapshot();
		expect(archive['static/familypack-latin-400-normal.woff2']).toEqual(
			staticWoff2Bytes,
		);
		expect(archive['static/familypack-latin-ext-700-normal.woff']).toEqual(
			staticWoffBytes,
		);
		expect(
			Array.from(archive['static/familypack-latin-700-normal.ttf'].slice(0, 4)),
		).toEqual([0, 1, 0, 0]);
		expect(fetchPackageTarball).toHaveBeenCalledWith(
			'familypack',
			'1.0.0',
			false,
		);
	});

	it('combines exact package versions using published variable filenames', async () => {
		const fallbackFilename = 'fallback-mono-normal.woff2';
		// The static package supplies LICENSE; the variable package need not repeat it.
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
		vi.spyOn(logger, 'error').mockImplementation(() => {});
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
	});

	it('publishes the download before individual warming completes', async () => {
		const warming = Promise.withResolvers<void>();
		const releaseUploads = Promise.withResolvers<void>();
		putObject.mockImplementation(async (key: string) => {
			if (key === 'abel@1.0.0/download.zip') {
				return;
			}

			warming.resolve();
			await releaseUploads.promise;
		});

		let finished = false;
		const build = buildArtifacts({
			mode: 'download',
			staticVersion: '1.0.0',
			metadata: staticMetadata,
		}).finally(() => {
			finished = true;
		});

		await warming.promise;
		expect(
			putObject.mock.calls.some(([key]) => key === 'abel@1.0.0/download.zip'),
		).toBe(true);
		expect(finished).toBe(false);
		releaseUploads.resolve();
		await expect(build).resolves.toBe(4);
	});

	it('filters download artifacts to files published for that version', async () => {
		fetchPackageTarball.mockResolvedValueOnce(
			tarballStream(
				await createPackageTarball(testCatalog.familypack.id, false, [
					'latin-400-normal.woff2',
					'latin-400-normal.woff',
					'latin-700-normal.woff2',
					'latin-700-normal.woff',
				]),
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
		expect(Object.keys(archive).sort()).toMatchSnapshot();
	});
});
