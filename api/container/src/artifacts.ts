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
	filename: string;
	bytes: Uint8Array;
	extension: 'woff2' | 'woff' | 'ttf';
}

const createArtifact = (
	key: string,
	filename: string,
	bytes: Uint8Array,
	extension: BuiltArtifact['extension'],
): BuiltArtifact => ({
	key,
	filename,
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
	packageFiles: ReadonlyMap<string, Uint8Array>,
): Promise<BuiltArtifact[]> => {
	const copyPlan = [...packageFiles].filter(
		([filename]) => filename.endsWith('.woff2') || filename.endsWith('.woff'),
	);
	const convertPlan = copyPlan.filter(([filename]) =>
		filename.endsWith('.woff2'),
	);

	console.log(
		`[artifacts] static build plan: copy=${copyPlan.length}, convert=${convertPlan.length}`,
	);

	const copied = copyPlan.map(([filename, bytes]) =>
		createArtifact(
			getStaticAssetKey(tag.id, tag.version, filename),
			filename,
			bytes,
			filename.endsWith('.woff2') ? 'woff2' : 'woff',
		),
	);

	if (convertPlan.length === 0) {
		return copied;
	}

	const ctx = createFontContext();
	try {
		const converted = await Promise.all(
			convertPlan.map(
				limitConcur(8, async ([sourceFilename, bytes]) => {
					const filename = sourceFilename.replace(/\.woff2$/, '.ttf');
					const [{ data }] = await convertFont(
						ctx,
						bytes,
						['ttf'],
						`${tag.id}-${sourceFilename}`,
					);

					return createArtifact(
						getStaticAssetKey(tag.id, tag.version, filename),
						filename,
						data,
						'ttf',
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
	packageFiles: ReadonlyMap<string, Uint8Array>,
): BuiltArtifact[] => {
	const sources = [...packageFiles].filter(([filename]) =>
		filename.endsWith('.woff2'),
	);
	console.log(`[artifacts] variable build plan: files=${sources.length}`);

	return sources.map(([filename, bytes]) =>
		createArtifact(
			getVariableAssetKey(tag.id, tag.version, filename),
			filename,
			bytes,
			'woff2',
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

	const built =
		request.mode === 'variable'
			? buildVariableArtifacts(request.tag, packageFiles)
			: await buildStaticArtifacts(request.tag, packageFiles);

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
	const [staticPackage, variablePackage] = await Promise.all([
		request.staticVersion
			? readPackageArchive(id, request.staticVersion, false)
			: undefined,
		request.variableVersion
			? readPackageArchive(id, request.variableVersion, true)
			: undefined,
	]);
	const packageWithLicense = staticPackage ?? variablePackage;
	if (!packageWithLicense) {
		throw new Error(`No package versions provided for ${id}`);
	}
	const license = getPackageFile(packageWithLicense, 'LICENSE');
	const staticArtifacts =
		request.staticVersion && staticPackage
			? await buildStaticArtifacts(
					{ id, version: request.staticVersion },
					staticPackage,
				)
			: [];
	const variableArtifacts =
		request.variableVersion && variablePackage
			? buildVariableArtifacts(
					{ id, version: request.variableVersion },
					variablePackage,
				)
			: [];
	if (request.staticVersion && staticArtifacts.length === 0) {
		throw new Error(
			`No static artifacts published for ${id}@${request.staticVersion}`,
		);
	}
	if (request.variableVersion && variableArtifacts.length === 0) {
		throw new Error(
			`No variable artifacts published for ${id}@${request.variableVersion}`,
		);
	}

	const artifacts = [...staticArtifacts, ...variableArtifacts];
	const archive = zipSync(
		Object.fromEntries([
			...staticArtifacts.map((artifact) => [
				`static/${id}-${artifact.filename}`,
				artifact.extension === 'ttf'
					? artifact.bytes
					: [artifact.bytes, { level: 0 }],
			]),
			...variableArtifacts.map((artifact) => [
				`variable/${id}-${artifact.filename}`,
				[artifact.bytes, { level: 0 }],
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
		const version = request.staticVersion ?? `vf@${request.variableVersion}`;
		console.error(
			`[artifacts] failed to warm ${warmFailures.length}/${artifacts.length} individual artifacts for ${id}@${version}`,
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
