import { convertFont, createFontContext } from '@fontsource-utils/core';
import { type Zippable, zipSync } from 'fflate';
import { HTTPException } from 'hono/http-exception';
import limitConcur from 'limit-concur';
import type {
	BuildFamilyRequest,
	BuildFileRequest,
	BuildVersionRequest,
	BuildVersionTag,
} from '../../shared/build';
import {
	type FontPackageEntry,
	type FontPackageManifest,
	filterPublishedManifest,
	findFontPackageEntry,
	resolveFontPackageManifest,
	type StaticFontEntry,
	type VariableFontEntry,
} from '../../shared/font-package-manifest';
import {
	BINARY_CONTENT_TYPES,
	getDownloadContentDisposition,
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
import { getObjectBytes, listKeys, putObject } from './r2';

interface BuiltArtifact {
	key: string;
	archivePath: string;
	bytes: Uint8Array;
	compress: boolean;
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

const storeArtifact = async (
	key: string,
	bytes: Uint8Array,
	item: { archivePath: string; extension: string; buildMode: string },
): Promise<BuiltArtifact> => {
	await putObject(key, bytes, {
		cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
		contentType:
			BINARY_CONTENT_TYPES[item.extension as keyof typeof BINARY_CONTENT_TYPES],
	});

	return {
		key,
		archivePath: item.archivePath,
		bytes,
		compress: item.buildMode === 'copy',
	};
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

	const copied = (
		await Promise.all(
			copyPlan.map(
				limitConcur(
					8,
					async (item) =>
						await ignoreUpstream404(
							storeArtifact(
								getStaticAssetKey(tag.id, tag.version, item.filename),
								await getStaticBytes(item.sourceFilename),
								item,
							),
						),
				),
			),
		)
	).filter((artifact): artifact is BuiltArtifact => artifact !== undefined);

	if (convertPlan.length === 0) {
		return copied;
	}

	const ctx = createFontContext();

	try {
		const converted = (
			await Promise.all(
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

								return storeArtifact(
									getStaticAssetKey(tag.id, tag.version, item.filename),
									data,
									item,
								);
							}),
					),
				),
			)
		).filter((artifact): artifact is BuiltArtifact => artifact !== undefined);

		return [...copied, ...converted];
	} finally {
		ctx.destroy();
	}
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
						await ignoreUpstream404(
							storeArtifact(
								getVariableAssetKey(tag.id, tag.version, item.filename),
								await fetchPackageAssetBytes(
									tag.id,
									tag.version,
									item.sourceFilename,
									true,
								),
								item,
							),
						),
				),
			),
		)
	).filter((artifact): artifact is BuiltArtifact => artifact !== undefined);
};

const isStaticEntry = (item: FontPackageEntry): item is StaticFontEntry =>
	!('axisKey' in item);

const getPublishedManifest = async (
	request: BuildVersionRequest,
): Promise<FontPackageManifest> => {
	const [publishedStaticFiles, publishedVariableFiles] = await Promise.all([
		fetchPackageFileList(request.tag.id, request.tag.version, false),
		request.axes
			? fetchPackageFileList(request.tag.id, request.tag.version, true)
			: Promise.resolve(undefined),
	]);

	return filterPublishedManifest(
		resolveFontPackageManifest(request.metadata, request.axes),
		publishedStaticFiles,
		publishedVariableFiles,
	);
};

const buildSingleArtifact = async (
	request: BuildFileRequest,
): Promise<number> => {
	const manifest = await getPublishedManifest(request);
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

	console.log(
		`[artifacts] built single file ${request.tag.id}@${request.tag.version}/${request.target.file}`,
	);

	return built.length;
};

/**
 * Builds the exact-version artifact set, skipping anything that already exists
 * in R2 and creating the combined family zip only when it is missing.
 */
const buildFamilyArtifacts = async (
	request: BuildFamilyRequest,
): Promise<number> => {
	const { tag } = request;
	const { static: staticManifest, variable: variableManifest } =
		await getPublishedManifest(request);

	console.log(
		`[artifacts] family manifest ${tag.id}@${tag.version}: static=${staticManifest.length}, variable=${variableManifest.length}`,
	);

	// Resolve R2 keys for every individual artifact and the download zip.
	const staticKeys = staticManifest.map((item) =>
		getStaticAssetKey(tag.id, tag.version, item.filename),
	);
	const variableKeys = variableManifest.map((item) =>
		getVariableAssetKey(tag.id, tag.version, item.filename),
	);
	const downloadKey = getDownloadKey(tag.id, tag.version);

	// One listing call to discover everything already stored for this version.
	const existing = await listKeys(`${tag.id}@${tag.version}/`);

	const totalCount = staticKeys.length + variableKeys.length + 1;

	// If every artifact exists already, no build work is needed.
	if (
		existing.has(downloadKey) &&
		staticKeys.every((k) => existing.has(k)) &&
		variableKeys.every((k) => existing.has(k))
	) {
		console.log(
			`[artifacts] family build skipped: all ${totalCount} artifacts already exist in R2`,
		);
		return totalCount;
	}

	// Build only the missing individual artifacts.
	const missingStatic = staticManifest.filter(
		(_, i) => !existing.has(staticKeys[i]),
	);
	const missingVariable = variableManifest.filter(
		(_, i) => !existing.has(variableKeys[i]),
	);

	console.log(
		`[artifacts] missing: ${missingStatic.length} static, ${missingVariable.length} variable, zip=${!existing.has(downloadKey) ? 'yes' : 'no'}`,
	);

	const [maybeStaticArtifacts, maybeVariableArtifacts] = await Promise.all([
		ignoreUpstream404(buildStaticArtifacts(tag, missingStatic)),
		ignoreUpstream404(buildVariableArtifacts(tag, missingVariable)),
	]);
	const newStaticArtifacts = maybeStaticArtifacts ?? [];
	const newVariableArtifacts = maybeVariableArtifacts ?? [];
	const newArtifacts = [...newStaticArtifacts, ...newVariableArtifacts];

	console.log(`[artifacts] built ${newArtifacts.length} new artifacts`);

	if (
		newArtifacts.length === 0 &&
		missingStatic.length + missingVariable.length > 0
	) {
		throw new Error(`No artifacts published for ${tag.id}@${tag.version}`);
	}

	// Build the download zip only when it is missing.
	if (!existing.has(downloadKey)) {
		console.log(`[artifacts] assembling download zip`);

		// Index freshly-built bytes by R2 key for quick lookup.
		const builtByKey = new Map<string, BuiltArtifact>();
		for (const artifact of newArtifacts) {
			builtByKey.set(artifact.key, artifact);
		}

		// Collect every artifact for the archive, using fresh bytes first and
		// loading existing objects from R2 when needed.
		const allManifestEntries = [
			...staticManifest.map((item, i) => ({ item, key: staticKeys[i] })),
			...variableManifest.map((item, i) => ({
				item,
				key: variableKeys[i],
			})),
		];

		let fetchedFromR2 = 0;

		const allArtifactEntries = await Promise.all(
			allManifestEntries.map(
				limitConcur(16, async ({ item, key }) => {
					const built = builtByKey.get(key);
					if (built) return built;

					// Load the existing artifact from R2 for the zip.
					fetchedFromR2++;
					const bytes = await getObjectBytes(key);
					if (!bytes) {
						throw new Error(`Expected artifact ${key} not found in R2`);
					}

					return {
						key,
						archivePath: item.archivePath,
						bytes,
						compress: item.buildMode === 'copy',
					} as BuiltArtifact;
				}),
			),
		);

		if (fetchedFromR2 > 0) {
			console.log(
				`[artifacts] fetched ${fetchedFromR2} existing artifacts from R2 for zip`,
			);
		}

		if (allArtifactEntries.length === 0) {
			throw new Error(`No artifacts for zip: ${tag.id}@${tag.version}`);
		}

		// Resolve LICENSE from the static or variable package.
		const license =
			(staticManifest.length > 0
				? await ignoreUpstream404(
						fetchPackageLicenseBytes(tag.id, tag.version, false),
					)
				: undefined) ??
			(variableManifest.length > 0
				? await ignoreUpstream404(
						fetchPackageLicenseBytes(tag.id, tag.version, true),
					)
				: undefined);

		if (!license) {
			throw new Error(`Missing LICENSE for ${tag.id}@${tag.version}`);
		}

		const archiveFiles: Zippable = Object.fromEntries([
			...allArtifactEntries.map((artifact) => [
				artifact.archivePath,
				artifact.compress ? [artifact.bytes, { level: 0 }] : artifact.bytes,
			]),
			['LICENSE', license],
		]);

		await putObject(
			getDownloadKey(tag.id, tag.version),
			zipSync(archiveFiles),
			{
				cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
				contentDisposition: getDownloadContentDisposition(tag.id, tag.version),
				contentType: BINARY_CONTENT_TYPES.zip,
			},
		);

		console.log(
			`[artifacts] zip uploaded (${allArtifactEntries.length} entries + LICENSE)`,
		);
	}

	return totalCount;
};

export const buildArtifacts = async (
	request: BuildVersionRequest,
): Promise<number> =>
	request.mode === 'file'
		? await buildSingleArtifact(request)
		: await buildFamilyArtifacts(request);
