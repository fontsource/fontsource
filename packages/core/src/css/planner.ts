import type { FontConfig, FontFace } from '../types';
import { determineAxisKey, findClosestWeight, formatStyle } from '../utils';

type StaticFace = FontFace & { isVariable: false; weight: number };

const isStaticFace = (face: FontFace): face is StaticFace =>
	!face.isVariable && typeof face.weight === 'number';

// Packages prefer a 400 weight normal face for `index.css`, but there are fonts
// which do not have weight 400, or are only italic.
const pickStaticIndexCSS = (faces: FontFace[]): string | undefined => {
	const findClosestFace = (candidates: readonly StaticFace[]) => {
		if (candidates.length === 0) {
			return undefined;
		}

		const weight = findClosestWeight(candidates.map((face) => face.weight));
		return candidates.find((face) => face.weight === weight);
	};

	const staticFaces = faces.filter(isStaticFace);
	const normalFaces = staticFaces.filter((face) => face.style === 'normal');

	const index = findClosestFace(normalFaces) ?? findClosestFace(staticFaces);

	if (!index) {
		return undefined;
	}

	return index.style === 'normal'
		? `${index.weight}.css`
		: `${index.weight}-${index.style}.css`;
};

const pickVariableIndexCSS = (
	variable: FontConfig['variable'],
	facesByCSSFile: ReadonlyMap<string, readonly FontFace[]>,
): string | undefined => {
	if (!variable) {
		return undefined;
	}

	// Prefer the primary-axis normal file, but fall back to the italic file.
	const axisKey = determineAxisKey(variable);
	const normalKey = `${axisKey}.css`;

	if (facesByCSSFile.has(normalKey)) {
		return normalKey;
	}

	const italicKey = `${axisKey}-italic.css`;
	return facesByCSSFile.has(italicKey) ? italicKey : undefined;
};

// One resolved face can feed multiple published CSS files, for example a static
// italic face contributes to both `400-italic.css` and `latin-italic.css`.
const groupFacesByCSSFile = (faces: FontFace[]): Map<string, FontFace[]> => {
	const facesByCSSFile = new Map<string, FontFace[]>();

	// Iterate over each face and assign it to the appropriate CSS files based on its properties.
	for (const face of faces) {
		for (const cssFile of getCSSFiles(face)) {
			const cssFaces = facesByCSSFile.get(cssFile);

			if (cssFaces) {
				cssFaces.push(face);
			} else {
				facesByCSSFile.set(cssFile, [face]);
			}
		}
	}

	return facesByCSSFile;
};

const getCSSFiles = (face: FontFace): string[] => {
	const style = formatStyle(face.style);

	if (face.isVariable) {
		const axisKey = face.axisKey ?? 'wght';
		return [style === 'normal' ? `${axisKey}.css` : `${axisKey}-${style}.css`];
	}

	// Static packages publish both weight and subset entrypoints.
	const assetFilenames = [
		style === 'normal' ? `${face.weight}.css` : `${face.weight}-${style}.css`,
		`${face.subset}.css`,
	];

	// Keep the legacy subset italic entrypoint.
	if (style !== 'normal') {
		assetFilenames.push(`${face.subset}-italic.css`);
	}

	return assetFilenames;
};

export {
	getCSSFiles,
	groupFacesByCSSFile,
	pickStaticIndexCSS,
	pickVariableIndexCSS,
};
