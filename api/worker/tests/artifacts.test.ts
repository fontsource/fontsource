import { unzipSync } from 'fflate';
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
	listKeys,
	getObjectBytes,
	fetchPackageAssetBytes,
	fetchPackageFileList,
	fetchPackageLicenseBytes,
	convertFont,
	destroy,
	createFontContext,
} = vi.hoisted(() => {
	const destroy = vi.fn();

	return {
		putObject: vi.fn(),
		listKeys: vi.fn(),
		getObjectBytes: vi.fn(),
		fetchPackageAssetBytes: vi.fn(),
		fetchPackageFileList: vi.fn(),
		fetchPackageLicenseBytes: vi.fn(),
		convertFont: vi.fn(),
		destroy,
		createFontContext: vi.fn(() => ({ destroy })),
	};
});

vi.mock('../container/src/r2', () => ({
	getObjectBytes,
	listKeys,
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
		fetchPackageLicenseBytes,
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
	beforeEach(() => {
		putObject.mockReset();
		listKeys.mockReset();
		getObjectBytes.mockReset();
		fetchPackageAssetBytes.mockReset();
		fetchPackageFileList.mockReset();
		fetchPackageLicenseBytes.mockReset();
		convertFont.mockReset();
		destroy.mockReset();
		createFontContext.mockClear();

		listKeys.mockResolvedValue(new Set<string>());
		getObjectBytes.mockResolvedValue(null);
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
		fetchPackageLicenseBytes.mockResolvedValue(
			new TextEncoder().encode('Example License'),
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

		expect(listKeys).not.toHaveBeenCalled();
		expect(fetchPackageLicenseBytes).not.toHaveBeenCalled();
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
			axes: variableAxes,
			target: {
				file: 'latin-full-normal.woff2',
				isVariable: true,
			},
		};

		await expect(buildArtifacts(request)).resolves.toBe(1);

		expect(listKeys).not.toHaveBeenCalled();
		expect(fetchPackageLicenseBytes).not.toHaveBeenCalled();
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
		expect(fetchPackageLicenseBytes).not.toHaveBeenCalled();
		expect(putObject).toHaveBeenCalledTimes(1);
		expect(putObject).toHaveBeenCalledWith(
			'abel@1.0.0/latin-400-normal.ttf',
			staticTtfBytes,
			expect.objectContaining({
				contentType: 'font/ttf',
			}),
		);
	});

	it('assembles family zip entries from the correct built artifacts', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		const request: BuildVersionRequest = {
			mode: 'family',
			tag: {
				id: testCatalog.familypack.id,
				version: '1.0.0',
			},
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
			'static/ttf/familypack-latin-400-normal.ttf',
			'static/ttf/familypack-latin-700-normal.ttf',
			'static/ttf/familypack-latin-ext-400-normal.ttf',
			'static/ttf/familypack-latin-ext-700-normal.ttf',
			'static/webfonts/familypack-latin-400-normal.woff',
			'static/webfonts/familypack-latin-400-normal.woff2',
			'static/webfonts/familypack-latin-700-normal.woff',
			'static/webfonts/familypack-latin-700-normal.woff2',
			'static/webfonts/familypack-latin-ext-400-normal.woff',
			'static/webfonts/familypack-latin-ext-400-normal.woff2',
			'static/webfonts/familypack-latin-ext-700-normal.woff',
			'static/webfonts/familypack-latin-ext-700-normal.woff2',
		]);
		expect(
			archive['static/webfonts/familypack-latin-400-normal.woff2'],
		).toEqual(staticWoff2Bytes);
		expect(
			archive['static/webfonts/familypack-latin-ext-700-normal.woff'],
		).toEqual(staticWoffBytes);
		expect(archive['static/ttf/familypack-latin-700-normal.ttf']).toEqual(
			staticTtfBytes,
		);
	});

	it('filters family artifacts to the files actually published for that version', async () => {
		const { buildArtifacts } = await import('../container/src/artifacts');
		fetchPackageFileList.mockImplementation(
			async (id, _version, isVariable = false) => {
				if (id === testCatalog.familypack.id && !isVariable) {
					return new Set([
						'latin-400-normal.woff2',
						'latin-400-normal.woff',
						'latin-700-normal.woff2',
						'latin-700-normal.woff',
					]);
				}

				return new Set(
					resolveFontPackageManifest(staticMetadata).static.map(
						(item) => item.sourceFilename,
					),
				);
			},
		);

		const request: BuildVersionRequest = {
			mode: 'family',
			tag: {
				id: testCatalog.familypack.id,
				version: '1.0.0',
			},
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
			'static/ttf/familypack-latin-400-normal.ttf',
			'static/ttf/familypack-latin-700-normal.ttf',
			'static/webfonts/familypack-latin-400-normal.woff',
			'static/webfonts/familypack-latin-400-normal.woff2',
			'static/webfonts/familypack-latin-700-normal.woff',
			'static/webfonts/familypack-latin-700-normal.woff2',
		]);
	});
});
