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
	faces.map((face) => renderFontFace(face, family, options)).join('\n\n');

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

	return Array.from(facesByFile, ([filename, faces]) => ({
		filename,
		content: generateFaceCSS(family, faces, options),
	}));
};

export { generateFaceCSS, generateFaceCSSAssets };
