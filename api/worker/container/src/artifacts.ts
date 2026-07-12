import { convertFont, createFontContext } from '@fontsource-utils/core';
import { zipSync } from 'fflate';
import limitConcur from 'limit-concur';
import { createGzipDecoder, unpackTar } from 'modern-tar';
import type {
	BuildDownloadRequest,
	BuildPackageRequest,
	BuildVersionRequest,
	BuildVersionTag,
} from '../../shared/build';
import {
	filterPublishedManifest,
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
import { fetchPackageTarball } from '../../shared/upstream';
import { putObject } from './r2';

interface BuiltArtifact {
	key: string;
	bytes: Uint8Array;
	extension: StaticFontEntry['extension'] | VariableFontEntry['extension'];
}

const createArtifact = (
	key: string,
	bytes: Uint8Array,
	extension: BuiltArtifact['extension'],
): BuiltArtifact => ({
	key,
	bytes,
	extension,
});

const getPackageFile = (
	files: ReadonlyMap<string, Uint8Array>,
	filename: string,
): Uint8Array => {
	const bytes = files.get(filename);
	if (!bytes) {
		throw new Error(`Expected npm package file "${filename}" was not found`);
	}

	return bytes;
};

const uploadArtifacts = (
	artifacts: readonly BuiltArtifact[],
): Promise<void>[] =>
	artifacts.map(
		limitConcur(8, async (artifact) => {
			await putObject(artifact.key, artifact.bytes, {
				cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
				contentType: BINARY_CONTENT_TYPES[artifact.extension],
			});
		}),
	);

const buildStaticArtifacts = async (
	tag: BuildVersionTag,
	manifest: readonly StaticFontEntry[],
	packageFiles: ReadonlyMap<string, Uint8Array>,
): Promise<BuiltArtifact[]> => {
	const copyPlan = manifest.filter((item) => item.buildMode === 'copy');
	const convertPlan = manifest.filter(
		(item) => item.buildMode === 'convert-woff-to-ttf',
	);

	console.log(
		`[artifacts] static build plan: copy=${copyPlan.length}, convert=${convertPlan.length}`,
	);

	const copied = copyPlan.map((item) =>
		createArtifact(
			getStaticAssetKey(tag.id, tag.version, item.filename),
			getPackageFile(packageFiles, item.sourceFilename),
			item.extension,
		),
	);

	if (convertPlan.length === 0) {
		return copied;
	}

	const ctx = createFontContext();
	try {
		const converted = await Promise.all(
			convertPlan.map(
				limitConcur(8, async (item) => {
					const [{ data }] = await convertFont(
						ctx,
						getPackageFile(packageFiles, item.sourceFilename),
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
		);

		return [...copied, ...converted];
	} finally {
		ctx.destroy();
	}
};

const buildVariableArtifacts = (
	tag: BuildVersionTag,
	manifest: readonly VariableFontEntry[],
	packageFiles: ReadonlyMap<string, Uint8Array>,
): BuiltArtifact[] => {
	console.log(`[artifacts] variable build plan: files=${manifest.length}`);

	return manifest.map((item) =>
		createArtifact(
			getVariableAssetKey(tag.id, tag.version, item.filename),
			getPackageFile(packageFiles, item.sourceFilename),
			item.extension,
		),
	);
};

const readPackageArchive = async (
	id: string,
	version: string,
	isVariable: boolean,
): Promise<Map<string, Uint8Array>> => {
	const assetPrefix = `package/files/${id}-`;
	const entries = await unpackTar(
		(await fetchPackageTarball(id, version, isVariable)).pipeThrough(
			createGzipDecoder(),
		),
		{
			strict: true,
			filter: (header) =>
				header.name === 'package/LICENSE' ||
				header.name.startsWith(assetPrefix),
		},
	);

	return new Map(
		entries.flatMap((entry) => {
			if (!entry.data) return [];

			const filename =
				entry.header.name === 'package/LICENSE'
					? 'LICENSE'
					: entry.header.name.slice(assetPrefix.length);
			return [[filename, entry.data]];
		}),
	);
};

const buildPackageArtifacts = async (
	request: BuildPackageRequest,
): Promise<number> => {
	const packageFiles = await readPackageArchive(
		request.tag.id,
		request.tag.version,
		request.mode === 'variable',
	);
	const manifest = resolveFontPackageManifest(
		request.metadata,
		request.metadata.variable || undefined,
	);

	const built =
		request.mode === 'variable'
			? buildVariableArtifacts(
					request.tag,
					manifest.variable.filter((item) =>
						packageFiles.has(item.sourceFilename),
					),
					packageFiles,
				)
			: await buildStaticArtifacts(
					request.tag,
					manifest.static.filter((item) =>
						packageFiles.has(item.sourceFilename),
					),
					packageFiles,
				);

	if (built.length === 0) {
		throw new Error(
			`No ${request.mode} artifacts published for ${request.tag.id}@${request.tag.version}`,
		);
	}

	await Promise.all(uploadArtifacts(built));

	console.log(
		`[artifacts] built ${built.length} ${request.mode} package artifacts for ${request.tag.id}@${request.tag.version}`,
	);

	return built.length;
};

const buildDownloadArtifacts = async (
	request: BuildDownloadRequest,
): Promise<number> => {
	const { id } = request.metadata;
	const axes = request.metadata.variable || undefined;
	if (axes && !request.variableVersion) {
		throw new Error(`Variable package version required for ${id}`);
	}

	const variableVersion = request.variableVersion ?? request.staticVersion;
	const staticTag = { id, version: request.staticVersion };
	const variableTag = { id, version: variableVersion };
	const [staticPackage, variablePackage] = await Promise.all([
		readPackageArchive(id, request.staticVersion, false),
		axes && request.variableVersion
			? readPackageArchive(id, request.variableVersion, true)
			: undefined,
	]);
	const { static: staticManifest, variable: variableManifest } =
		filterPublishedManifest(
			resolveFontPackageManifest(request.metadata, axes),
			new Set(staticPackage.keys()),
			variablePackage ? new Set(variablePackage.keys()) : undefined,
		);

	if (staticManifest.length === 0 || (axes && variableManifest.length === 0)) {
		throw new Error(
			`No artifacts published for ${id}@${request.staticVersion}`,
		);
	}

	const license = getPackageFile(staticPackage, 'LICENSE');
	const staticArtifacts = await buildStaticArtifacts(
		staticTag,
		staticManifest,
		staticPackage,
	);
	const variableArtifacts = variablePackage
		? buildVariableArtifacts(variableTag, variableManifest, variablePackage)
		: [];
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

	await putObject(
		getDownloadKey(id, request.staticVersion, request.variableVersion),
		archive,
		{
			cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
			contentType: BINARY_CONTENT_TYPES.zip,
		},
	);
	const warmResults = await Promise.allSettled(uploadArtifacts(artifacts));
	const warmFailures = warmResults.filter(
		(result) => result.status === 'rejected',
	);
	if (warmFailures.length > 0) {
		console.error(
			`[artifacts] failed to warm ${warmFailures.length}/${artifacts.length} individual artifacts for ${id}@${request.staticVersion}`,
			warmFailures.map((result) => result.reason),
		);
	}

	return artifacts.length + 1;
};

export const buildArtifacts = async (
	request: BuildVersionRequest,
): Promise<number> =>
	request.mode === 'download'
		? await buildDownloadArtifacts(request)
		: await buildPackageArtifacts(request);
