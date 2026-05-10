import type {
	CSSBuildOptions,
	FontConfig,
	FontFace,
	PublishedFontFace,
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

const resolveFamilyId = ({ id, family }: FontConfig): string =>
	id ?? normalizeKebabCase(family);

/**
 * Get the full list of font faces to generate for a given font configuration.
 */
export const resolveFontFaces = (
	config: FontConfig,
	options: ResolveFontFaceOptions = {},
): FontFace[] => {
	const {
		subsets,
		weights,
		styles,
		unicodeRange = {},
		variable,
		formats = ['woff2'],
	} = config;

	const faces: FontFace[] = [];
	const isVariable = !!variable;
	const familyId = resolveFamilyId(config);

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
				for (const style of styles) {
					faces.push({
						subset,
						weight: cssWeight,
						style: getFaceStyle(axisKey, style, axisConfig),
						isVariable: true,
						unicodeRange: unicodeRange[subset] ?? '',
						sources: variableFormats.map((format) => ({
							format,
							filename: generateVariableFilename(
								familyId,
								subset,
								axisKey,
								style,
								0,
								format,
							),
						})),
						axisKey,
						stretch,
						sliceIndex: 0,
					});
				}
			}
		}
	} else {
		// Generate one unique face per subset, weight, and style combination for static faces.
		for (const subset of subsets) {
			for (const weight of weights) {
				for (const style of styles) {
					faces.push({
						subset,
						weight,
						style,
						isVariable: false,
						unicodeRange: unicodeRange[subset] ?? '',
						sources: formats.map((format) => ({
							format,
							filename: generateStaticFilename(
								familyId,
								subset,
								weight,
								style,
								0,
								format,
							),
						})),
						sliceIndex: 0,
					});
				}
			}
		}
	}

	return faces;
};

/**
 * Returns the canonical published face/source records for a config, preserving
 * CSS-facing fields while exposing the public package filenames separately.
 */
export const resolvePublishedFaces = (
	config: FontConfig,
	options: ResolveFontFaceOptions = {},
): PublishedFontFace[] => {
	const familyId = resolveFamilyId(config);
	const idPrefix = `${familyId}-`;

	return resolveFontFaces(config, options).map((face) => ({
		...face,
		sources: face.sources.map((source) => ({
			...source,
			publicFilename: source.filename.startsWith(idPrefix)
				? source.filename.slice(idPrefix.length)
				: source.filename,
		})),
	}));
};
