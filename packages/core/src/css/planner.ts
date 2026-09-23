import type { FontFace, VariableAxisConfig } from '../types';
import { findClosestWeight, formatStyle } from '../utils/style';
import { determineAxisKey } from '../utils/variable';

type StaticFace = FontFace & { isVariable: false; weight: number };

const isStaticFace = (face: FontFace): face is StaticFace =>
	!face.isVariable && typeof face.weight === 'number';

// Packages prefer a 400 weight normal face for `index.css`, but there are fonts
// which do not have weight 400, or are only italic.
const pickStaticIndexCSS = (faces: readonly FontFace[]): string | undefined => {
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
		: `${index.weight}-${formatStyle(index.style)}.css`;
};

const pickVariableIndexCSS = (
	variable: VariableAxisConfig,
	facesByCSSFile: ReadonlyMap<string, readonly FontFace[]>,
): string | undefined => {
	// Prefer the primary-axis normal file, but fall back to the italic file.
	const axisKey = determineAxisKey(variable);
	return [`${axisKey}.css`, `${axisKey}-italic.css`].find((filename) =>
		facesByCSSFile.has(filename),
	);
};

// One resolved face can feed multiple published CSS files, for example a static
// italic face contributes to both `400-italic.css` and `latin-italic.css`.
const groupFacesByCSSFile = (
	faces: readonly FontFace[],
): Map<string, FontFace[]> => {
	const facesByCSSFile = new Map<string, FontFace[]>();
	const useSlicedAggregate = faces.some((face) => face.sliceIndex > 0);

	for (const face of faces) {
		for (const cssFile of getCSSFiles(face, useSlicedAggregate)) {
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

const getCSSFiles = (face: FontFace, useSlicedAggregate = false): string[] => {
	const style = formatStyle(face.style);
	const isSlice = face.sliceIndex > 0;
	const isAggregateFace = !useSlicedAggregate || isSlice;

	if (face.isVariable) {
		if (!isAggregateFace) return [];

		const axisKey = face.axisKey ?? 'wght';
		return [style === 'normal' ? `${axisKey}.css` : `${axisKey}-${style}.css`];
	}

	const assetFilenames = isAggregateFace
		? [
				style === 'normal'
					? `${face.weight}.css`
					: `${face.weight}-${style}.css`,
			]
		: [];

	// Named subsets and full-repertoire builds keep their direct entrypoints.
	if (!isSlice) {
		assetFilenames.push(`${face.subset}.css`);
		// Keep the legacy subset italic entrypoint.
		if (style !== 'normal') assetFilenames.push(`${face.subset}-italic.css`);
	}

	return assetFilenames;
};

export {
	getCSSFiles,
	groupFacesByCSSFile,
	pickStaticIndexCSS,
	pickVariableIndexCSS,
};
