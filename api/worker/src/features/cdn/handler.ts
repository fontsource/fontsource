import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type {
	SourceFontMetadata,
	VariableAxes,
} from '../../../../shared/catalog';
import {
	findFontPackageEntry,
	resolveFontPackageManifest,
} from '../../../../shared/font-package-manifest';
import type { PackageOutputManifest } from '../../../../shared/package-output';
import { toResponseBody } from '../../../../shared/response';
import { getBinaryKey, getDownloadKey } from '../../../../shared/storage';
import {
	fetchPackageFileList,
	fetchPackageOutput,
	isPackageVersionPublished,
	UpstreamNotFoundError,
} from '../../../../shared/upstream';
import { CACHE_POLICIES, CONTENT_TYPES } from '../../constants';
import { ensurePackageBuilt, startDownloadBuild } from '../../container/client';
import type { AppEnv } from '../../env';
import { toHttpDate } from '../../utils/cache';
import { badGateway, badRequest, notFound } from '../../utils/errors';
import {
	isPinnedVersion,
	type ParsedFontTag,
	parseFontTag,
	resolveVersionTag,
} from '../font-tag';
import { getFontById, getPublishedVersions } from '../metadata/store';
import { getCssAsset } from './css';

interface ResolvedAssetTag extends Omit<ParsedFontTag, 'version'> {
	/** The version string as originally requested (e.g. "latest", "1", "1.2"). */
	requestedVersion: string;
	/** The resolved exact semver string that was looked up in R2 (e.g. "1.2.3"). */
	version: string;
}

export type ResolvedFontRequest = { tag: ResolvedAssetTag } & (
	| { manifest: PackageOutputManifest; metadata?: never; axes?: never }
	| { manifest?: never; metadata: SourceFontMetadata; axes?: VariableAxes }
);

interface BinaryMetadata {
	etag?: string;
	lastModified?: string;
}

type StoredBinaryAsset =
	| (BinaryMetadata & {
			body: ReadableStream<Uint8Array> | Uint8Array;
			state: 'body';
	  })
	| (BinaryMetadata & {
			state: 'not_modified';
	  });

export const getAssetCachePolicy = (requestedVersion: string) =>
	isPinnedVersion(requestedVersion)
		? CACHE_POLICIES.immutable
		: CACHE_POLICIES.floating;

/**
 * Resolves a public CDN request to the exact package version that should serve
 * it, loading variable-axis metadata when present.
 *
 * Accepts either a raw tag string (which will be parsed) or a pre-parsed
 * {@link ParsedFontTag} to avoid redundant parsing when the caller already
 * owns one.
 */
export const resolveFontRequest = async (
	c: Context<AppEnv>,
	rawTag: string | ParsedFontTag,
): Promise<ResolvedFontRequest> => {
	const parsedTag = typeof rawTag === 'string' ? parseFontTag(rawTag) : rawTag;
	const versions = isPinnedVersion(parsedTag.version)
		? undefined
		: await getPublishedVersions(parsedTag.id, parsedTag.isVariable);
	// Preserve the legacy unknown-family response when no package versions exist.
	if (versions?.length === 0 && !(await getFontById(c, parsedTag.id)))
		throw notFound('Not Found. Font does not exist.');
	const version = versions
		? resolveVersionTag(parsedTag.version, versions)
		: parsedTag.version;
	const tag = { ...parsedTag, requestedVersion: parsedTag.version, version };
	// Older packages predate manifests and retain their legacy catalog behavior.
	if (Number(version.split('.')[0]) >= 6) {
		return {
			tag,
			manifest: await fetchPackageOutput(tag.id, version, tag.isVariable),
		};
	}
	const metadata = await getFontById(c, tag.id);
	if (!metadata) throw notFound('Not Found. Font does not exist.');
	const axes =
		metadata.variable && typeof metadata.variable === 'object'
			? metadata.variable
			: undefined;
	if (tag.isVariable && !axes)
		throw notFound(`Not Found. Variable metadata for ${tag.id} not found.`);
	return { tag, metadata, axes };
};

/**
 * Attempts to read a binary asset from R2, honouring conditional request
 * headers (`If-None-Match`, `If-Modified-Since`) via R2's built-in `onlyIf`
 * option. Returns `undefined` when the object does not exist in R2, and a
 * `not_modified` state object when the conditional check short-circuits.
 */
const getStoredBinaryAsset = async (
	c: Context<AppEnv>,
	tag: Pick<ParsedFontTag, 'id' | 'isVariable' | 'version'>,
	file: string,
	requestHeaders?: Headers,
): Promise<StoredBinaryAsset | undefined> =>
	getStoredBinaryObject(c, getBinaryKey(tag, file), requestHeaders);

const getStoredBinaryObject = async (
	c: Context<AppEnv>,
	key: string,
	requestHeaders?: Headers,
): Promise<StoredBinaryAsset | undefined> => {
	const onlyIf =
		requestHeaders &&
		(requestHeaders.has('If-None-Match') ||
			requestHeaders.has('If-Modified-Since'))
			? requestHeaders
			: undefined;
	const existing = await c.env.FONTS.get(key, onlyIf ? { onlyIf } : undefined);

	return existing
		? existing.body === undefined
			? {
					state: 'not_modified',
					etag: existing.httpEtag,
					lastModified: toHttpDate(existing.uploaded),
				}
			: {
					state: 'body',
					body: existing.body,
					etag: existing.httpEtag,
					lastModified: toHttpDate(existing.uploaded),
				}
		: undefined;
};

const getExtension = (
	filename: string,
): keyof typeof CONTENT_TYPES | undefined => {
	const extension = filename.split('.').pop();

	if (!extension) {
		return undefined;
	}

	return extension in CONTENT_TYPES
		? (extension as keyof typeof CONTENT_TYPES)
		: undefined;
};

const toAttachmentFilename = (
	id: string,
	version: string,
	file: string,
): string => `${id}_${version}_${file}`;

const ensurePublishedPinnedAsset = async (
	resolved: ResolvedFontRequest,
	file: string,
	sourceFilename: string,
): Promise<void> => {
	try {
		const publishedFiles = await fetchPackageFileList(
			resolved.tag.id,
			resolved.tag.version,
			resolved.tag.isVariable,
		);

		if (!publishedFiles.has(sourceFilename)) {
			throw notFound(
				`Requested file ${file} not found for ${resolved.tag.id}@${resolved.tag.version}`,
			);
		}
	} catch (error) {
		if (
			error instanceof UpstreamNotFoundError &&
			!(await isPackageVersionPublished(
				resolved.tag.id,
				resolved.tag.version,
				resolved.tag.isVariable,
			))
		) {
			throw notFound(`Unable to resolve version "${resolved.tag.version}"`);
		}

		if (error instanceof HTTPException && error.status === 404) {
			throw error;
		}

		console.warn(
			`[cdn] published-file preflight skipped for ${resolved.tag.id}${resolved.tag.isVariable ? ':vf' : ''}@${resolved.tag.version}/${file}`,
			error,
		);
	}
};

/**
 * Builds the binary CDN response, including conditional requests and stable
 * download filenames.
 */
const respondWithBinary = (
	body: StoredBinaryAsset,
	options: {
		cachePolicy: HeadersInit;
		contentType: keyof typeof CONTENT_TYPES;
		filename: string;
	},
): Response => {
	const headers = new Headers(options.cachePolicy);
	headers.set('Content-Type', CONTENT_TYPES[options.contentType]);

	if (body.etag) {
		headers.set('ETag', body.etag);
	}

	if (body.lastModified) {
		headers.set('Last-Modified', body.lastModified);
	}

	if (body.state === 'not_modified') {
		return new Response(null, { status: 304, headers });
	}

	headers.set(
		'Content-Disposition',
		`attachment; filename="${options.filename}"`,
	);

	return new Response(toResponseBody(body.body), { status: 200, headers });
};

export const getDownloadAsset = async (
	c: Context<AppEnv>,
	id: string,
): Promise<Response> => {
	const [staticVersions, variableVersions] = await Promise.all([
		getPublishedVersions(id, false),
		getPublishedVersions(id, true),
	]);
	const staticVersion =
		staticVersions.length > 0
			? resolveVersionTag('latest', staticVersions)
			: undefined;
	const variableVersion = variableVersions.length
		? resolveVersionTag('latest', variableVersions)
		: undefined;
	if (!staticVersion && !variableVersion) {
		throw notFound(
			'Unable to resolve download: no published versions available',
		);
	}
	const downloadKey = getDownloadKey(id, staticVersion, variableVersion);
	const readDownload = () =>
		getStoredBinaryObject(c, downloadKey, c.req.raw.headers);
	const respond = (asset: StoredBinaryAsset) =>
		respondWithBinary(asset, {
			cachePolicy: {
				...CACHE_POLICIES.floating,
				'Cache-Control': 'public, no-cache',
			},
			contentType: 'zip',
			filename: `${id}.zip`,
		});

	const existing = await readDownload();
	if (existing) {
		return respond(existing);
	}

	const build = await startDownloadBuild(c, {
		mode: 'download',
		staticVersion,
		variableVersion,
		id,
	});
	if (build.state === 'building') {
		return Response.json(
			{
				state: 'building',
				version: staticVersion ?? variableVersion,
			},
			{
				status: 202,
				headers: {
					...CACHE_POLICIES.noStore,
					'Retry-After': '3',
				},
			},
		);
	}

	const built = await readDownload();
	if (!built) {
		throw badGateway(
			`Bad Gateway. Artifact build completed without persisting "${downloadKey}".`,
		);
	}

	return respond(built);
};

/**
 * Serves public binary assets from R2, building the exact version on demand if
 * the requested file has not been warmed yet.
 */
const findManifestSource = (
	manifest: PackageOutputManifest,
	tag: ParsedFontTag,
	file: string,
): string | undefined => {
	const sources = manifest.faces.flatMap((face) => face.sources);
	const filename = `${tag.id}-${file}`;
	if (sources.some((source) => source.filename === filename)) return file;
	// Desktop downloads are decoded from the actual static WOFF2; the builder selects TTF or OTF.
	if (!tag.isVariable && (file.endsWith('.ttf') || file.endsWith('.otf'))) {
		const woff2 = `${file.slice(0, -4)}.woff2`;
		if (
			sources.some(
				(source) =>
					source.format === 'woff2' && source.filename === `${tag.id}-${woff2}`,
			)
		)
			return woff2;
	}
	return undefined;
};

export const getBinaryAsset = async (
	c: Context<AppEnv>,
	tag: string,
	file: string,
): Promise<Response> => {
	const contentType = getExtension(file);

	if (!contentType || contentType === 'css' || contentType === 'json') {
		throw badRequest('Bad Request. Invalid file extension.');
	}

	const parsedTag = parseFontTag(tag);
	const pinnedVersion = isPinnedVersion(parsedTag.version);

	// Fast-path: pinned version already in R2
	const pinned = pinnedVersion
		? await getStoredBinaryAsset(c, parsedTag, file, c.req.raw.headers)
		: undefined;

	if (pinned) {
		// Exact-version requests can skip metadata resolution entirely when the
		// object is already in R2.
		return respondWithBinary(pinned, {
			cachePolicy: getAssetCachePolicy(parsedTag.version),
			contentType,
			filename: toAttachmentFilename(parsedTag.id, parsedTag.version, file),
		});
	}

	// Resolve version (for floating) or validate font exists (for pinned)
	const resolved = await resolveFontRequest(c, parsedTag);
	const sourceFilename = resolved.manifest
		? findManifestSource(resolved.manifest, resolved.tag, file)
		: findFontPackageEntry(
				resolveFontPackageManifest(resolved.metadata, resolved.axes),
				{ file, isVariable: resolved.tag.isVariable },
			)?.sourceFilename;
	if (!sourceFilename) throw notFound('Not Found. File does not exist.');
	if (pinnedVersion && !resolved.manifest)
		await ensurePublishedPinnedAsset(resolved, file, sourceFilename);

	// For pinned versions, the fast-path already checked R2 and missed,
	// so skip straight to build. For floating versions, try R2 with the resolved version.
	const respond = (asset: StoredBinaryAsset) =>
		respondWithBinary(asset, {
			cachePolicy: getAssetCachePolicy(resolved.tag.requestedVersion),
			contentType,
			filename: toAttachmentFilename(
				resolved.tag.id,
				resolved.tag.version,
				file,
			),
		});

	if (!pinnedVersion) {
		const existing = await getStoredBinaryAsset(
			c,
			resolved.tag,
			file,
			c.req.raw.headers,
		);

		if (existing) {
			return respond(existing);
		}
	}

	await ensurePackageBuilt(c, resolved);
	const built = await getStoredBinaryAsset(
		c,
		resolved.tag,
		file,
		c.req.raw.headers,
	);

	if (!built) {
		throw notFound('Not Found. File does not exist.');
	}
	return respond(built);
};

export const getCssFile = async (
	c: Context<AppEnv>,
	tag: string,
	file: string,
): Promise<Response> => {
	if (!file.endsWith('.css')) {
		throw badRequest('Bad Request. Invalid file extension.');
	}

	return await getCssAsset(c, tag, file);
};
