import type { CSSAsset, FontFace, VariableAxisConfig } from '../types';
import { type FontFaceOptions, renderFontFace } from './face-rule';
import {
	groupFacesByCSSFile,
	pickStaticIndexCSS,
	pickVariableIndexCSS,
} from './planner';

/** Render the supplied faces in order, preserving their filenames and coverage. */
const generateFaceCSS = (
	family: string,
	faces: readonly FontFace[],
	options: FontFaceOptions = {},
): string =>
	faces
		.map((face) => renderFontFace(face, family, options))
		.join(options.minify ? '' : '\n\n');

// Group resolved faces into published CSS assets.
const generateFaceCSSAssets = (
	family: string,
	faces: readonly FontFace[],
	options: FontFaceOptions & { variable?: VariableAxisConfig } = {},
): CSSAsset[] => {
	const { variable } = options;
	const facesByFile = groupFacesByCSSFile(faces);

	const indexCSSFile = variable
		? pickVariableIndexCSS(variable, facesByFile)
		: pickStaticIndexCSS(faces);

	const indexFaces = indexCSSFile ? facesByFile.get(indexCSSFile) : undefined;
	if (indexFaces) facesByFile.set('index.css', indexFaces);

	// Subset, weight and index entrypoints share faces. Resolve URLs and render
	// each face once per build, without retaining anything between builds.
	const rendered = new Map<FontFace, string>();
	return Array.from(facesByFile, ([filename, faces]) => ({
		filename,
		content: faces
			.map((face) => {
				const css = rendered.get(face) ?? renderFontFace(face, family, options);
				rendered.set(face, css);
				return css;
			})
			.join(options.minify ? '' : '\n\n'),
	}));
};

export { generateFaceCSS, generateFaceCSSAssets };
