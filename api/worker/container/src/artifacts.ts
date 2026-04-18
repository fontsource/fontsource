import { convertFont, createFontContext } from '@fontsource-utils/core';
import { type Zippable, zipSync } from 'fflate';
import limitConcur from 'limit-concur';
import type { BuildVersionRequest, BuildVersionTag } from '../../shared/build';
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
	fetchPackageLicenseBytes,
	UpstreamNotFoundError,
} from '../../shared/upstream';
import {
	generateStaticManifest,
	generateVariableManifest,
	type StaticArtifactPlanItem,
	type VariableArtifactPlanItem,
} from './manifest';
import { putObject } from './r2';

interface BuiltArtifact {
	archivePath: string;
	bytes: Uint8Array;
	compress: boolean;
}

/** Catches `UpstreamNotFoundError` and returns `undefined` instead of throwing. */
const ignoreUpstream404 = async <T>(
	promise: Promise<T>,
): Promise<T | undefined> => {
	try {
		return await promise;
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
		archivePath: item.archivePath,
		bytes,
		compress: item.buildMode === 'copy',
	};
};

const buildStaticArtifacts = async (
	tag: BuildVersionTag,
	manifest: readonly StaticArtifactPlanItem[],
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

	const copied = await Promise.all(
		copyPlan.map(
			limitConcur(8, async (item) =>
				storeArtifact(
					getStaticAssetKey(tag.id, tag.version, item.filename),
					await getStaticBytes(item.sourceFilename),
					item,
				),
			),
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
		);

		return [...copied, ...converted];
	} finally {
		ctx.destroy();
	}
};

const buildVariableArtifacts = async (
	tag: BuildVersionTag,
	manifest: readonly VariableArtifactPlanItem[],
): Promise<BuiltArtifact[]> => {
	if (manifest.length === 0) {
		return [];
	}

	return Promise.all(
		manifest.map(
			limitConcur(8, async (item) =>
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
	);
};

/**
 * Builds the full exact-version artifact set and stores one combined family zip.
 */
export const buildArtifacts = async (
	request: BuildVersionRequest,
): Promise<number> => {
	const { tag, metadata, axes } = request;
	const staticManifest = generateStaticManifest(metadata);
	const variableManifest = axes ? generateVariableManifest(metadata, axes) : [];

	const staticArtifacts =
		(await ignoreUpstream404(buildStaticArtifacts(tag, staticManifest))) ?? [];
	const variableArtifacts =
		(await ignoreUpstream404(buildVariableArtifacts(tag, variableManifest))) ??
		[];

	const allArtifacts = [...staticArtifacts, ...variableArtifacts];

	if (allArtifacts.length === 0) {
		throw new Error(`No artifacts published for ${tag.id}@${tag.version}`);
	}

	// Resolve LICENSE from the static or variable package.
	const license =
		(staticArtifacts.length > 0
			? await ignoreUpstream404(
					fetchPackageLicenseBytes(tag.id, tag.version, false),
				)
			: undefined) ??
		(variableArtifacts.length > 0
			? await ignoreUpstream404(
					fetchPackageLicenseBytes(tag.id, tag.version, true),
				)
			: undefined);

	if (!license) {
		throw new Error(`Missing LICENSE for ${tag.id}@${tag.version}`);
	}

	// Build the combined zip archive.
	const archiveFiles: Zippable = Object.fromEntries([
		...allArtifacts.map((artifact) => [
			artifact.archivePath,
			artifact.compress ? [artifact.bytes, { level: 0 }] : artifact.bytes,
		]),
		['LICENSE', license],
	]);

	await putObject(getDownloadKey(tag.id, tag.version), zipSync(archiveFiles), {
		cacheControl: IMMUTABLE_ASSET_CACHE_CONTROL,
		contentDisposition: getDownloadContentDisposition(tag.id, tag.version),
		contentType: BINARY_CONTENT_TYPES.zip,
	});

	return allArtifacts.length + 1;
};
