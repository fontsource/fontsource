import type { CSSAsset, CSSBuildOptions, FontConfig } from '../types';
import { resolveFontFaces } from '../utils';
import { generateFaceCSSAssets } from './assets';
import {
	type FontFaceOptions,
	renderFontFace,
	type UrlResolver,
} from './face-rule';

export type CSSOptions = FontFaceOptions & CSSBuildOptions;

/**
 * Generate publishable CSS assets from a config suitable for NPM packages. It generates
 * all necessary variations of CSS files, for example `latin.css`, `400.css`, and `index.css`.
 */
const generateCSSAssets = (
	config: FontConfig,
	options: CSSOptions = {},
): CSSAsset[] => {
	// Expand config once, then reuse the face-based pipeline.
	const faces = resolveFontFaces(config, options);
	return generateFaceCSSAssets(config.family, faces, {
		...options,
		variable: config.variable,
	});
};

/**
 * Generate one stylesheet from a config..
 *
 * Unlike `generateCSSAssets()`, this does not emit package entrypoints like
 * `latin.css`, `400.css`, or `index.css`. Each face is rendered exactly once in
 * one combined stylesheet.
 */
const generateCSS = (config: FontConfig, options: CSSOptions = {}): string =>
	resolveFontFaces(config, options)
		.map((face) => renderFontFace(face, config.family, options))
		.join('\n\n');

export { generateCSS, generateCSSAssets, type UrlResolver };
