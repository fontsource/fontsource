import type { CSSAsset, FontFace, VariableAxisConfig } from '../types';
import { type CSSOptions, renderFontFace } from './face-rule';
import {
	groupFacesByCSSFile,
	pickStaticIndexCSS,
	pickVariableIndexCSS,
} from './planner';

/** Render the supplied faces in order, preserving their filenames and coverage. */
const generateCSS = (
	family: string,
	faces: readonly FontFace[],
	options: CSSOptions = {},
): string =>
	faces
		.map((face) => renderFontFace(face, family, options))
		.join(options.minify ? '' : '\n\n');

// Group resolved faces into published CSS assets.
const generateCSSAssets = (
	family: string,
	faces: readonly FontFace[],
	options: CSSOptions & { variable?: VariableAxisConfig } = {},
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

export { generateCSS, generateCSSAssets };
