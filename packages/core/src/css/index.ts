import type { CSSAsset, CSSBuildOptions, FontConfig } from '../types';
import { resolveFontFaces } from '../utils/faces';
import { generateFaceCSS, generateFaceCSSAssets } from './assets';
import type { FontFaceOptions, UrlResolver } from './face-rule';

export type CSSOptions = FontFaceOptions & CSSBuildOptions;
export type {
	CSSAsset,
	FontConfig,
	FontFace,
	FontSource,
	FontStyle,
	VariableAxisConfig,
} from '../types';
export { formatAxisValue } from '../utils/style';
export {
	determineAxisKey,
	getFaceStretch,
	getFaceStyle,
	selectVariableAxisKey,
} from '../utils/variable';
export {
	type CSSFontFace,
	type CSSRenderOptions,
	type FontFaceOptions,
	renderFontFaceRule,
} from './face-rule';

/**
 * Generate publishable CSS assets from a config suitable for NPM packages. It generates
 * all necessary variations of CSS files, for example `latin.css`, `400.css`, and `index.css`.
 */
const generateCSSAssets = (
	config: FontConfig,
	options: CSSOptions = {},
): CSSAsset[] => {
	const faces = resolveFontFaces(config, options);
	return generateFaceCSSAssets(config.family, faces, {
		...options,
		variable: config.variable,
	});
};

/**
 * Generate one stylesheet from a config.
 *
 * Unlike `generateCSSAssets()`, this does not emit package entrypoints like
 * `latin.css`, `400.css`, or `index.css`. Each face is rendered exactly once in
 * one combined stylesheet.
 */
const generateCSS = (config: FontConfig, options: CSSOptions = {}): string =>
	generateFaceCSS(config.family, resolveFontFaces(config, options), options);

export {
	generateCSS,
	generateCSSAssets,
	generateFaceCSS,
	generateFaceCSSAssets,
	type UrlResolver,
};
