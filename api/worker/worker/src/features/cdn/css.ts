import {
	type CSSAsset,
	type CSSOptions,
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
const PUBLIC_CDN_BASE = new URL(`${UPSTREAM_URLS.publicCdn}/`);

const buildPublicUrl = (path: string): string =>
	new URL(path, PUBLIC_CDN_BASE).toString();

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
 * Generates all CSS assets for a static font package and returns the one
 * matching `filename`, or `undefined` if no asset by that name exists.
 */
const findStaticCssAsset = (
	metadata: SourceFontMetadata,
	filename: string,
	options: CSSOptions & {
		resolveUrl: (input: {
			subset: string;
			weight: number;
			style: string;
			extension: 'woff2' | 'woff';
		}) => string;
	},
) =>
	generateCSSAssets(buildFontConfig(metadata, { formats: ['woff2', 'woff'] }), {
		...options,
		resolver: ({ face, source }) => {
			if (
				typeof face.weight !== 'number' ||
				(source.format !== 'woff2' && source.format !== 'woff')
			) {
				throw new Error(`Invalid static CSS source "${source.filename}"`);
			}

			return options.resolveUrl({
				subset: face.subset,
				weight: face.weight,
				style: face.style,
				extension: source.format,
			});
		},
	}).find((asset) => asset.filename === filename);

/**
 * Generates all CSS assets for a variable font package and returns the one
 * matching `filename`, or `undefined` if no asset by that name exists.
 */
const findVariableCssAsset = (
	metadata: SourceFontMetadata,
	axes: VariableAxes,
	filename: string,
	options: CSSOptions & {
		resolveUrl: (input: {
			subset: string;
			axisKey: string;
			style: string;
		}) => string;
	},
) =>
	generateCSSAssets(buildFontConfig(metadata, { formats: ['woff2'], axes }), {
		...options,
		resolver: ({ face, source }) => {
			if (!face.axisKey || source.format !== 'woff2') {
				throw new Error(`Invalid variable CSS source "${source.filename}"`);
			}

			return options.resolveUrl({
				subset: face.subset,
				axisKey: face.axisKey,
				style: face.style,
			});
		},
	}).find((asset) => asset.filename === filename);

/**
 * Builds one CSS response for the public CDN route.
 */
export const getCssAsset = async (
	c: Context<AppEnv>,
	rawTag: string,
	filename: string,
): Promise<Response> => {
	const { tag, metadata, axes } = await resolveFontRequest(c, rawTag);
	const resolvedTag = tag.isVariable
		? `${tag.id}:vf@${tag.version}`
		: `${tag.id}@${tag.version}`;
	let asset: CSSAsset | undefined;
	if (tag.isVariable) {
		if (!axes) {
			throw notFound(`Not Found. Variable metadata for ${tag.id} not found.`);
		}

		asset = findVariableCssAsset(metadata, axes, filename, {
			display: CSS_DISPLAY,
			resolveUrl: ({ subset, axisKey, style }) =>
				buildPublicUrl(
					`fonts/${resolvedTag}/${subset}-${axisKey.toLowerCase()}-${style}.woff2`,
				),
		});
	} else {
		asset = findStaticCssAsset(metadata, filename, {
			display: CSS_DISPLAY,
			resolveUrl: ({ subset, weight, style, extension }) =>
				buildPublicUrl(
					`fonts/${resolvedTag}/${subset}-${weight}-${style}.${extension}`,
				),
		});
	}

	if (!asset) {
		throw notFound('Not Found. File does not exist.');
	}

	return createCssResponse(
		asset.content,
		tag.requestedVersion,
		metadata.lastModified,
	);
};
