import {
	type CSSAsset,
	type FontConfig,
	generateCSSAssets,
	resolveFontFaces,
} from '@fontsource-utils/core/css';
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
import { getAssetCachePolicy, resolveFontRequest } from './handler';

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
			...getAssetCachePolicy(requestedVersion),
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
		minify: boolean;
		axes?: VariableAxes;
	},
): CSSAsset | undefined => {
	const formats: FontConfig['formats'] = options.axes
		? ['woff2']
		: ['woff2', 'woff'];
	const config = buildFontConfig(metadata, { formats, axes: options.axes });

	// Variable package CSS filenames are lowercase even when custom axis tags are not.
	return generateCSSAssets(config.family, resolveFontFaces(config), {
		variable: config.variable,
		minify: options.minify,
		// Sources use the formats selected above; only the public URL needs adapting.
		resolver: ({ source }) => {
			const publicFilename = getPublicFilename(metadata.id, source.filename);
			return `${UPSTREAM_URLS.publicCdn}/fonts/${resolvedTag}/${publicFilename}`;
		},
	}).find(
		(asset) =>
			asset.filename === filename ||
			(options.axes !== undefined && asset.filename.toLowerCase() === filename),
	);
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
	const isMinified = filename.endsWith('.min.css');
	const assetFilename = filename.replace(/\.min\.css$/, '.css');

	const asset = findCssAsset(metadata, assetFilename, resolvedTag, {
		minify: isMinified,
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
