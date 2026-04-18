import type { Context } from 'hono';
import type {
	SourceFontMetadata,
	VariableAxes,
} from '../../../../shared/catalog';
import { getDownloadAttachmentFilename } from '../../../../shared/http-metadata';
import { resolveFontPackageManifest } from '../../../../shared/font-package-manifest';
import { getBinaryKey } from '../../../../shared/storage';
import { CACHE_HEADERS, CONTENT_TYPES } from '../../constants';
import { ensureVersionBuilt } from '../../container/client';
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

export interface ResolvedFontRequest {
	tag: ResolvedAssetTag;
	metadata: SourceFontMetadata;
	axes?: VariableAxes;
}

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

export const getAssetCacheControl = (requestedVersion: string): string =>
	isPinnedVersion(requestedVersion)
		? CACHE_HEADERS.immutableAsset
		: CACHE_HEADERS.floatingAsset;

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
	const metadata = await getFontById(c, parsedTag.id);

	if (!metadata) {
		throw notFound('Not Found. Font does not exist.');
	}

	const axes =
		metadata.variable && typeof metadata.variable === 'object'
			? metadata.variable
			: undefined;

	if (parsedTag.isVariable && !axes) {
		throw notFound(
			`Not Found. Variable metadata for ${parsedTag.id} not found.`,
		);
	}

	const versions = isPinnedVersion(parsedTag.version)
		? undefined
		: await getPublishedVersions(parsedTag.id, parsedTag.isVariable);
	const resolvedVersion = versions
		? resolveVersionTag(parsedTag.version, versions)
		: parsedTag.version;

	return {
		tag: {
			id: parsedTag.id,
			isVariable: parsedTag.isVariable,
			requestedVersion: parsedTag.version,
			version: resolvedVersion,
		},
		metadata,
		axes,
	};
};

/**
 * Attempts to read a binary asset from R2, honouring conditional request
 * headers (`If-None-Match`, `If-Modified-Since`) via R2's built-in `onlyIf`
 * option. Returns `undefined` when the object does not exist in R2, and a
 * `not_modified` state object when the conditional check short-circuits.
 */
export const getStoredBinaryAsset = async (
	c: Context<AppEnv>,
	tag: Pick<ParsedFontTag, 'id' | 'isVariable' | 'version'>,
	file: string,
	requestHeaders?: Headers,
): Promise<StoredBinaryAsset | undefined> => {
	const onlyIf =
		requestHeaders &&
		(requestHeaders.has('If-None-Match') ||
			requestHeaders.has('If-Modified-Since'))
			? requestHeaders
			: undefined;
	const existing = await c.env.FONTS.get(
		getBinaryKey(tag, file),
		onlyIf ? { onlyIf } : undefined,
	);

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
): string =>
	file === 'download.zip'
		? getDownloadAttachmentFilename(id, version)
		: `${id}_${version}_${file}`;

/**
 * Builds the binary CDN response, including conditional requests and stable
 * download filenames.
 */
const respondWithBinary = (
	body: StoredBinaryAsset,
	options: {
		cacheControl: string;
		contentType: keyof typeof CONTENT_TYPES;
		filename: string;
	},
): Response => {
	const headers = new Headers({
		'Cache-Control': options.cacheControl,
		'Content-Type': CONTENT_TYPES[options.contentType],
	});

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

	return new Response(body.body, { status: 200, headers });
};

/**
 * Serves public binary assets from R2, building the exact version on demand if
 * the requested file has not been warmed yet.
 */
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

	// Fast-path: pinned version already in R2
	const pinned = isPinnedVersion(parsedTag.version)
		? await getStoredBinaryAsset(c, parsedTag, file, c.req.raw.headers)
		: undefined;

	if (pinned) {
		// Exact-version requests can skip metadata resolution entirely when the
		// object is already in R2.
		return respondWithBinary(pinned, {
			cacheControl: getAssetCacheControl(parsedTag.version),
			contentType,
			filename: toAttachmentFilename(parsedTag.id, parsedTag.version, file),
		});
	}

	// Resolve version (for floating) or validate font exists (for pinned)
	const resolved = await resolveFontRequest(c, parsedTag);
	const packageManifest = resolveFontPackageManifest(
		resolved.metadata,
		resolved.axes,
	);

	// Validate that the requested filename belongs to this package.
	if (file !== 'download.zip') {
		if (resolved.tag.isVariable) {
			if (!resolved.axes) {
				throw notFound(
					`Not Found. Variable metadata for ${resolved.tag.id} not found.`,
				);
			}

			if (!packageManifest.variable.some((item) => item.filename === file)) {
				throw notFound('Not Found. File does not exist.');
			}
		} else if (!packageManifest.static.some((item) => item.filename === file)) {
			throw notFound('Not Found. File does not exist.');
		}
	}

	// For pinned versions, the fast-path already checked R2 and missed,
	// so skip straight to build. For floating versions, try R2 with the resolved version.
	if (!isPinnedVersion(parsedTag.version)) {
		const existing = await getStoredBinaryAsset(
			c,
			resolved.tag,
			file,
			c.req.raw.headers,
		);

		if (existing) {
			return respondWithBinary(existing, {
				cacheControl: getAssetCacheControl(resolved.tag.requestedVersion),
				contentType,
				filename: toAttachmentFilename(
					resolved.tag.id,
					resolved.tag.version,
					file,
				),
			});
		}
	}

	// Cold miss — trigger an on-demand build then re-fetch.
	await ensureVersionBuilt(c, resolved);
	const built = await getStoredBinaryAsset(
		c,
		resolved.tag,
		file,
		c.req.raw.headers,
	);

	if (!built) {
		if (file !== 'download.zip') {
			throw notFound('Not Found. File does not exist.');
		}

		throw badGateway(
			`Bad Gateway. Artifact build completed without persisting "${resolved.tag.id}${resolved.tag.isVariable ? ':vf' : ''}@${resolved.tag.version}/${file}".`,
		);
	}

	return respondWithBinary(built, {
		cacheControl: getAssetCacheControl(resolved.tag.requestedVersion),
		contentType,
		filename: toAttachmentFilename(resolved.tag.id, resolved.tag.version, file),
	});
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
