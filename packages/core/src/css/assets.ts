import type { CSSAsset, FontConfig, FontFace } from '../types';
import { type FontFaceOptions, renderFontFace } from './face-rule';
import {
	groupFacesByCSSFile,
	pickStaticIndexCSS,
	pickVariableIndexCSS,
} from './planner';

// Group resolved faces into published CSS assets.
const generateFaceCSSAssets = (
	family: string,
	faces: FontFace[],
	options: FontFaceOptions & { variable?: FontConfig['variable'] } = {},
): CSSAsset[] => {
	const { variable, ...fontFaceOptions } = options;
	const facesByFile = groupFacesByCSSFile(faces);

	const indexCSSFile = variable
		? pickVariableIndexCSS(variable, facesByFile)
		: pickStaticIndexCSS(faces);

	// If an index CSS file is selected, also publish it as `index.css`.
	if (indexCSSFile) {
		const indexFaces = facesByFile.get(indexCSSFile);
		if (indexFaces) {
			facesByFile.set('index.css', indexFaces);
		}
	}

	// Render each CSS file with the appropriate faces.
	const assets: CSSAsset[] = [];
	for (const [filename, faces] of facesByFile) {
		const content = faces
			.map((face) => renderFontFace(face, family, fontFaceOptions))
			.join('\n\n');

		assets.push({ filename, content });
	}

	return assets;
};

export { generateFaceCSSAssets, renderFontFace };
