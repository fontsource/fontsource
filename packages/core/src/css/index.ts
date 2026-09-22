export type { CSSAsset, FontConfig, FontFace, FontStyle } from '../types';
export { resolveFontFaces } from '../utils/faces';
export { formatAxisValue } from '../utils/style';
export {
	determineAxisKey,
	getFaceStretch,
	getFaceStyle,
	selectVariableAxisKey,
} from '../utils/variable';
export { generateCSS, generateCSSAssets } from './assets';
export {
	type CSSFontFace,
	renderFontFaceRule,
	type UrlResolver,
} from './face-rule';
