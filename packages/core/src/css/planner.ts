import type { FontConfig, FontFace } from '../types';
import { determineAxisKey, findClosestWeight } from '../utils';

type StaticFace = FontFace & { isVariable: false; weight: number };

const isStaticFace = (face: FontFace): face is StaticFace =>
	!face.isVariable && typeof face.weight === 'number';

const pickStaticIndexFile = (faces: FontFace[]): string | undefined => {
	const staticFaces = faces.filter(isStaticFace);

	if (staticFaces.length === 0) {
		return undefined;
	}

	// Prefer a normal face for `index.css`, but sometimes there may only be italic only families.
	const normalFaces = staticFaces.filter((face) => face.style === 'normal');
	const candidates = normalFaces.length > 0 ? normalFaces : staticFaces;

	// Find the face with the closest weight to 400, which is the most common default weight.
	const preferredWeight = findClosestWeight(
		candidates.map((face) => face.weight),
	);

	const defaultFace =
		candidates.find((face) => face.weight === preferredWeight) ?? candidates[0];

	return defaultFace.style === 'normal'
		? `${defaultFace.weight}.css`
		: `${defaultFace.weight}-${defaultFace.style}.css`;
};

const pickVariableIndexFile = (
	variable: FontConfig['variable'],
	facesByAssetFilename: ReadonlyMap<string, readonly FontFace[]>,
): string | undefined => {
	if (!variable) {
		return undefined;
	}

	// Prefer the primary-axis normal file, but fall back to the italic file.
	const axisKey = determineAxisKey(variable);
	const normalKey = `${axisKey}.css`;

	if (facesByAssetFilename.has(normalKey)) {
		return normalKey;
	}

	const italicKey = `${axisKey}-italic.css`;
	return facesByAssetFilename.has(italicKey) ? italicKey : undefined;
};

// A face can belong to multiple published files.
const groupFacesByAssetFilename = (
	faces: FontFace[],
): Map<string, FontFace[]> => {
	const facesByAssetFilename = new Map<string, FontFace[]>();

	for (const face of faces) {
		for (const assetFilename of getAssetFilenames(face)) {
			const assetFaces = facesByAssetFilename.get(assetFilename);

			if (assetFaces) {
				assetFaces.push(face);
			} else {
				facesByAssetFilename.set(assetFilename, [face]);
			}
		}
	}

	return facesByAssetFilename;
};

const getAssetFilenames = (face: FontFace): string[] => {
	if (face.isVariable) {
		// Variable packages group by axis bucket + style.
		const axisKey = face.axisKey ?? 'wght';
		return [
			face.style === 'normal'
				? `${axisKey}.css`
				: `${axisKey}-${face.style}.css`,
		];
	}

	// Static packages publish both weight and subset entrypoints.
	const assetFilenames = [
		face.style === 'normal'
			? `${face.weight}.css`
			: `${face.weight}-${face.style}.css`,
		`${face.subset}.css`,
	];

	// Keep the legacy subset italic entrypoint.
	if (face.style !== 'normal') {
		assetFilenames.push(`${face.subset}-italic.css`);
	}

	return assetFilenames;
};

export {
	getAssetFilenames,
	groupFacesByAssetFilename,
	pickStaticIndexFile,
	pickVariableIndexFile,
};
