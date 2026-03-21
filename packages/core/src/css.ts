import {
	buildFontFaceRule,
	type FaceRuleBuildOptions,
	renderFontFaceRule,
	type UrlResolver,
} from './css/face-rule';
import {
	groupFacesByAssetFilename,
	pickStaticIndexFile,
	pickVariableIndexFile,
} from './css/planner';
import type { CSSAsset, FontConfig, FontFace } from './types';
import { resolveFontFaces } from './utils';

type GenerateCSSOptions = FaceRuleBuildOptions;

interface GenerateCSSFromFacesOptions extends GenerateCSSOptions {
	// Used to determine the index.css default key.
	variable?: FontConfig['variable'];
}

/**
 * Render one `@font-face` block from a resolved face definition.
 */
const generateFontFace = (
	face: FontFace,
	family: string,
	options: GenerateCSSOptions = {},
): string => {
	return renderFontFaceRule(buildFontFaceRule(face, family, options));
};

/**
 * Group resolved faces into published CSS assets.
 *
 * Each face becomes one `@font-face` rule, even when it exposes multiple source
 * files.
 */
const generateCSSFromFaces = (
	family: string,
	faces: FontFace[],
	options: GenerateCSSFromFacesOptions = {},
): CSSAsset[] => {
	const { variable, ...fontFaceOptions } = options;

	// A face can contribute to more than one published file.
	const facesByAssetFilename = groupFacesByAssetFilename(faces);

	const indexAssetFilename = variable
		? pickVariableIndexFile(variable, facesByAssetFilename)
		: pickStaticIndexFile(faces);
	if (indexAssetFilename) {
		const indexFaces = facesByAssetFilename.get(indexAssetFilename);
		if (indexFaces) {
			// `index.css` aliases an existing planned file.
			facesByAssetFilename.set('index.css', indexFaces);
		}
	}

	return Array.from(facesByAssetFilename.entries()).map(
		([filename, assetFaces]) => ({
			filename,
			// One stylesheet per planned filename.
			content: assetFaces
				.map((face) => generateFontFace(face, family, fontFaceOptions))
				.join('\n\n'),
		}),
	);
};

/**
 * Generate published CSS assets from the public `FontConfig` shape.
 * Wrappers should prefer this metadata-driven entrypoint.
 */
const generateCSS = (
	config: FontConfig,
	options: GenerateCSSOptions = {},
): CSSAsset[] => {
	// Expand config once, then reuse the face-based pipeline.
	const faces = resolveFontFaces(config);
	return generateCSSFromFaces(config.family, faces, {
		...options,
		variable: config.variable,
	});
};

export {
	type GenerateCSSOptions,
	type UrlResolver,
	generateFontFace,
	generateCSS,
	generateCSSFromFaces,
};
