import {
	type CSSAsset,
	type CSSOptions,
	type FontConfig,
	generateCSSAssets,
} from '@fontsource-utils/core';
import type { Context } from 'hono';
import type {
	SourceFontMetadata,
	VariableAxes,
} from '../../../../shared/catalog';
import { buildFontConfig } from '../../../../shared/font-config';
import { UPSTREAM_URLS } from '../../constants';
import type { AppEnv } from '../../env';
import { toHttpDate } from '../../utils/cache';
import { notFound } from '../../utils/errors';
import { getAssetCacheControl, resolveFontRequest } from './handler';

/**
 * CDN CSS responses always use `font-display: swap` so the generated stylesheets
 * match the public package defaults.
 */
const CSS_DISPLAY = 'swap';
const PUBLIC_CDN_BASE = `${UPSTREAM_URLS.publicCdn}/`;

const buildPublicUrl = (path: string): string => `${PUBLIC_CDN_BASE}${path}`;

const getPublicFilename = (id: string, filename: string): string => {
	const prefix = `${id}-`;
	return filename.startsWith(prefix) ? filename.slice(prefix.length) : filename;
};

const createCssResponse = (
	content: string,
	requestedVersion: string,
	lastModifiedValue: Date | string | undefined,
): Response => {
	const lastModified = toHttpDate(lastModifiedValue);

	return new Response(content, {
		status: 200,
		headers: {
			'Cache-Control': getAssetCacheControl(requestedVersion),
			'Content-Type': 'text/css; charset=utf-8',
			...(lastModified ? { 'Last-Modified': lastModified } : {}),
		},
	});
};

/**
 * Generates all CSS assets for a font package (static or variable) and returns
 * the one matching `filename`, or `undefined` if no asset by that name exists.
 */
const findCssAsset = (
	metadata: SourceFontMetadata,
	filename: string,
	resolvedTag: string,
	options: {
		display: CSSOptions['display'];
		axes?: VariableAxes;
	},
): CSSAsset | undefined => {
	const formats: FontConfig['formats'] = options.axes
		? ['woff2']
		: ['woff2', 'woff'];
	const config = buildFontConfig(metadata, { formats, axes: options.axes });

	return generateCSSAssets(config, {
		...options,
		resolver: ({ face, source }) => {
			if (options.axes) {
				if (!face.axisKey || source.format !== 'woff2') {
					throw new Error(`Invalid variable CSS source "${source.filename}"`);
				}
			} else {
				if (source.format !== 'woff2' && source.format !== 'woff') {
					throw new Error(`Invalid static CSS source "${source.filename}"`);
				}
			}

			const publicFilename = getPublicFilename(metadata.id, source.filename);
			return buildPublicUrl(`fonts/${resolvedTag}/${publicFilename}`);
		},
	}).find((asset) => asset.filename === filename);
};

/**
 * Builds one CSS response for the public CDN route.
 */
export const getCssAsset = async (
	c: Context<AppEnv>,
	rawTag: string,
	filename: string,
): Promise<Response> => {
	const { tag, metadata, axes } = await resolveFontRequest(c, rawTag);

	if (tag.isVariable && !axes) {
		throw notFound(`Not Found. Variable metadata for ${tag.id} not found.`);
	}

	const resolvedTag = tag.isVariable
		? `${tag.id}:vf@${tag.version}`
		: `${tag.id}@${tag.version}`;

	const asset = findCssAsset(metadata, filename, resolvedTag, {
		display: CSS_DISPLAY,
		axes: tag.isVariable ? axes : undefined,
	});

	if (!asset) {
		throw notFound('Not Found. File does not exist.');
	}

	return createCssResponse(
		asset.content,
		tag.requestedVersion,
		metadata.lastModified,
	);
};
