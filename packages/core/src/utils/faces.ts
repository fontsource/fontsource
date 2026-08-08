import type {
	CSSBuildOptions,
	FontConfig,
	FontFace,
	WebFontFormat,
} from '../types';
import { generateStaticFilename, generateVariableFilename } from './filename';
import { findClosestWeight, formatAxisValue } from './style';
import { normalizeKebabCase } from './text';
import {
	getFaceStretch,
	getFaceStyle,
	getRequestedAxisKeys,
	pickAxisConfig,
} from './variable';

type ResolveFontFaceOptions = CSSBuildOptions;

/**
 * Get the full list of font faces to generate for a given font configuration.
 */
export const resolveFontFaces = (
	config: FontConfig,
	options: ResolveFontFaceOptions = {},
): FontFace[] => {
	const {
		id,
		family,
		subsets,
		weights,
		styles,
		unicodeRange = {},
		subsetSlices = {},
		variable,
		formats = ['woff2'],
	} = config;

	const faces: FontFace[] = [];
	const isVariable = !!variable;
	const familyId = id ?? normalizeKebabCase(family);

	if (isVariable) {
		const axisKeys = getRequestedAxisKeys(variable, options.axisKeys);

		// Filter out ttf formats for variable fonts.
		const variableFormats = formats.filter(
			(format): format is WebFontFormat => format !== 'ttf',
		);

		// Generate one face per axis key, with the weight set to the closest available weight.
		for (const axisKey of axisKeys) {
			const axisConfig = pickAxisConfig(variable, axisKey);
			const cssWeight = axisConfig.wght
				? formatAxisValue(axisConfig.wght)
				: `${findClosestWeight(weights)}`;

			const stretch = getFaceStretch(axisKey, axisConfig);

			for (const subset of subsets) {
				const characterSets = subsetSlices[subset]?.length
					? subsetSlices[subset]
					: [{ id: 0, unicodeRange: unicodeRange[subset] ?? '' }];
				for (const {
					id: sliceIndex,
					unicodeRange: faceRange,
				} of characterSets) {
					for (const style of styles) {
						faces.push({
							subset,
							weight: cssWeight,
							style: getFaceStyle(axisKey, style, axisConfig),
							isVariable: true,
							unicodeRange: faceRange,
							sources: variableFormats.map((format) => ({
								format,
								filename: generateVariableFilename(
									familyId,
									subset,
									axisKey,
									style,
									sliceIndex,
									format,
								),
							})),
							axisKey,
							stretch,
							sliceIndex,
						});
					}
				}
			}
		}
	} else {
		// Generate one unique face per subset, weight, and style combination for static faces.
		for (const subset of subsets) {
			const characterSets = subsetSlices[subset]?.length
				? subsetSlices[subset]
				: [{ id: 0, unicodeRange: unicodeRange[subset] ?? '' }];
			for (const { id: sliceIndex, unicodeRange: faceRange } of characterSets) {
				for (const weight of weights) {
					for (const style of styles) {
						faces.push({
							subset,
							weight,
							style,
							isVariable: false,
							unicodeRange: faceRange,
							sources: formats.map((format) => ({
								format,
								filename: generateStaticFilename(
									familyId,
									subset,
									weight,
									style,
									sliceIndex,
									format,
								),
							})),
							sliceIndex,
						});
					}
				}
			}
		}
	}

	return faces;
};
