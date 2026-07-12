import { convertFont, createFontContext } from '@fontsource-utils/core';
import { zipSync } from 'fflate';
import { HTTPException } from 'hono/http-exception';
import limitConcur from 'limit-concur';
import type {
	BuildDownloadRequest,
	BuildFileRequest,
	BuildVersionRequest,
	BuildVersionTag,
} from '../../shared/build';
import {
	type FontPackageEntry,
	filterPublishedManifest,
	findFontPackageEntry,
	resolveFontPackageManifest,
	type StaticFontEntry,
	type VariableFontEntry,
} from '../../shared/font-package-manifest';
import {
	BINARY_CONTENT_TYPES,
	IMMUTABLE_ASSET_CACHE_CONTROL,
} from '../../shared/http-metadata';
import {
	getDownloadKey,
	getStaticAssetKey,
	getVariableAssetKey,
} from '../../shared/storage';
import {
	fetchPackageAssetBytes,
	fetchPackageFileList,
	fetchPackageLicenseBytes,
	UpstreamNotFoundError,
} from '../../shared/upstream';
import { putObject } from './r2';

interface BuiltArtifact {
	key: string;
	bytes: Uint8Array;
	extension: StaticFontEntry['extension'] | VariableFontEntry['extension'];
}

/** Catches `UpstreamNotFoundError` and returns `undefined` instead of throwing. */
const ignoreUpstream404 = async <T>(
	input: Promise<T> | (() => Promise<T>),
): Promise<T | undefined> => {
	try {
		return await (typeof input === 'function' ? input() : input);
	} catch (error) {
		if (error instanceof UpstreamNotFoundError) {
			return undefined;
		}

		throw error;
	}
};

const createArtifact = (
	key: string,
	bytes: Uint8Array,
	extension: BuiltArtifact['extension'],
): BuiltArtifact => ({
	key,
	bytes,
	extension,
});

const storeArtifacts = async (
	artifacts: readonly BuiltArtifact[],
): Promise<void> => {
	await Promise.all(
		artifacts.map(
			limitConcur(8, async (artifact) => {
				await putObject(artifact.key, artifact.bytes, {
					cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
					contentType: BINARY_CONTENT_TYPES[artifact.extension],
				});
			}),
		),
	);
};

const buildStaticArtifacts = async (
	tag: BuildVersionTag,
	manifest: readonly StaticFontEntry[],
): Promise<BuiltArtifact[]> => {
	if (manifest.length === 0) {
		return [];
	}

	// Memoize static package fetches so repeated `.woff` reads for TTF
	// conversion do not hit the upstream CDN twice.
	const fetchCache = new Map<string, Promise<Uint8Array>>();
	const getStaticBytes = (filename: string): Promise<Uint8Array> => {
		const existing = fetchCache.get(filename);
		if (existing) {
			return existing;
		}

		const load = fetchPackageAssetBytes(tag.id, tag.version, filename);
		fetchCache.set(filename, load);
		return load;
	};

	const copyPlan = manifest.filter((item) => item.buildMode === 'copy');
	const convertPlan = manifest.filter(
		(item) => item.buildMode === 'convert-woff-to-ttf',
	);

	console.log(
		`[artifacts] static build plan: copy=${copyPlan.length}, convert=${convertPlan.length}`,
	);

	const copiedPromise = Promise.all(
		copyPlan.map(
			limitConcur(
				8,
				async (item) =>
					await ignoreUpstream404(async () =>
						createArtifact(
							getStaticAssetKey(tag.id, tag.version, item.filename),
							await getStaticBytes(item.sourceFilename),
							item.extension,
						),
					),
			),
		),
	);

	if (convertPlan.length === 0) {
		return (await copiedPromise).filter(
			(artifact): artifact is BuiltArtifact => artifact !== undefined,
		);
	}

	const convertedPromise = (async () => {
		const ctx = createFontContext();

		try {
			return await Promise.all(
				convertPlan.map(
					limitConcur(
						8,
						async (item) =>
							await ignoreUpstream404(async () => {
								const [{ data }] = await convertFont(
									ctx,
									await getStaticBytes(item.sourceFilename),
									['ttf'],
									`${tag.id}-${item.sourceFilename}`,
								);

								return createArtifact(
									getStaticAssetKey(tag.id, tag.version, item.filename),
									data,
									item.extension,
								);
							}),
					),
				),
			);
		} finally {
			ctx.destroy();
		}
	})();
	const [copied, converted] = await Promise.all([
		copiedPromise,
		convertedPromise,
	]);

	return [...copied, ...converted].filter(
		(artifact): artifact is BuiltArtifact => artifact !== undefined,
	);
};

const buildVariableArtifacts = async (
	tag: BuildVersionTag,
	manifest: readonly VariableFontEntry[],
): Promise<BuiltArtifact[]> => {
	if (manifest.length === 0) {
		return [];
	}

	console.log(`[artifacts] variable build plan: files=${manifest.length}`);

	return (
		await Promise.all(
			manifest.map(
				limitConcur(
					8,
					async (item) =>
						await ignoreUpstream404(async () =>
							createArtifact(
								getVariableAssetKey(tag.id, tag.version, item.filename),
								await fetchPackageAssetBytes(
									tag.id,
									tag.version,
									item.sourceFilename,
									true,
								),
								item.extension,
							),
						),
				),
			),
		)
	).filter((artifact): artifact is BuiltArtifact => artifact !== undefined);
};

const isStaticEntry = (item: FontPackageEntry): item is StaticFontEntry =>
	!('axisKey' in item);

const buildSingleArtifact = async (
	request: BuildFileRequest,
): Promise<number> => {
	const publishedFiles = await fetchPackageFileList(
		request.tag.id,
		request.tag.version,
		request.target.isVariable,
	);
	const manifest = filterPublishedManifest(
		resolveFontPackageManifest(
			request.metadata,
			request.metadata.variable || undefined,
		),
		request.target.isVariable ? new Set() : publishedFiles,
		request.target.isVariable ? publishedFiles : undefined,
	);
	const entry = findFontPackageEntry(manifest, request.target);

	if (!entry) {
		throw new HTTPException(404, {
			message: `Requested file ${request.target.file} not found for ${request.tag.id}@${request.tag.version}`,
		});
	}

	const built = isStaticEntry(entry)
		? await buildStaticArtifacts(request.tag, [entry])
		: await buildVariableArtifacts(request.tag, [entry]);

	if (built.length === 0) {
		throw new HTTPException(404, {
			message: `No artifact published for ${request.tag.id}@${request.tag.version}/${request.target.file}`,
		});
	}

	await storeArtifacts(built);

	console.log(
		`[artifacts] built single file ${request.tag.id}@${request.tag.version}/${request.target.file}`,
	);

	return built.length;
};

const buildDownloadArtifacts = async (
	request: BuildDownloadRequest,
): Promise<number> => {
	const { id } = request.metadata;
	const axes = request.metadata.variable || undefined;
	const variableVersion = request.variableVersion ?? request.staticVersion;
	const staticTag = { id, version: request.staticVersion };
	const variableTag = { id, version: variableVersion };
	const [publishedStaticFiles, publishedVariableFiles] = await Promise.all([
		fetchPackageFileList(id, request.staticVersion, false),
		axes && request.variableVersion
			? fetchPackageFileList(id, request.variableVersion, true)
			: undefined,
	]);
	const { static: staticManifest, variable: variableManifest } =
		filterPublishedManifest(
			resolveFontPackageManifest(request.metadata, axes),
			publishedStaticFiles,
			publishedVariableFiles,
		);

	if (staticManifest.length === 0 && variableManifest.length === 0) {
		throw new Error(
			`No artifacts published for ${id}@${request.staticVersion}`,
		);
	}

	const [staticArtifacts, variableArtifacts, license] = await Promise.all([
		buildStaticArtifacts(staticTag, staticManifest),
		buildVariableArtifacts(variableTag, variableManifest),
		fetchPackageLicenseBytes(id, request.staticVersion, false),
	]);
	const artifacts = [...staticArtifacts, ...variableArtifacts];
	const builtByKey = new Map(
		artifacts.map((artifact) => [artifact.key, artifact.bytes]),
	);
	const archiveEntries = [
		...staticManifest.map((item) => ({
			item,
			key: getStaticAssetKey(id, request.staticVersion, item.filename),
			directory: 'static',
		})),
		...variableManifest.map((item) => ({
			item,
			key: getVariableAssetKey(id, variableVersion, item.filename),
			directory: 'variable',
		})),
	].map(({ item, key, directory }) => {
		const bytes = builtByKey.get(key);
		if (!bytes) {
			throw new Error(`Expected artifact ${key} was not built`);
		}

		return {
			path: `${directory}/${id}-${item.filename}`,
			bytes,
			compress: item.buildMode === 'copy',
		};
	});
	const archive = zipSync(
		Object.fromEntries([
			...archiveEntries.map((entry) => [
				entry.path,
				entry.compress ? [entry.bytes, { level: 0 }] : entry.bytes,
			]),
			['LICENSE', license],
		]),
	);

	await storeArtifacts(artifacts);
	await putObject(
		getDownloadKey(id, request.staticVersion, request.variableVersion),
		archive,
		{
			cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
			contentType: BINARY_CONTENT_TYPES.zip,
		},
	);

	return artifacts.length + 1;
};

export const buildArtifacts = async (
	request: BuildVersionRequest,
): Promise<number> =>
	request.mode === 'file'
		? await buildSingleArtifact(request)
		: await buildDownloadArtifacts(request);
