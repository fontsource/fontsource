import {
	exportFonts,
	type FamilySettings,
	type SubsetAxisSetting,
	sortFontsIntoFamilies,
} from '@glypht/bundler-utils';
import type { FontRef, StyleValues } from '@glypht/core';
import type { FontContext } from './context';
import { type CSSOptions, generateCSSAssets } from './css/assets';
import { normalizeFontBuffer } from './normalize';

import type {
	FontAsset,
	FontBuildConfig,
	FontBuildResult,
	FontFace,
	FontStyle,
	VariableAxisConfig,
	WebFontFormat,
} from './types';
import {
	codepointsToRangeString,
	extractStyleValue,
	formatAxisValue,
	formatSlantValue,
	formatStyle,
	generateStaticFilename,
	generateVariableFilename,
	normalizeKebabCase,
} from './utils';
import { getFaceStretch, getFaceStyle, pickAxisConfig } from './utils/variable';

const VARIABLE_STYLE_AXIS_MAP: Partial<Record<string, string>> = {
	wght: 'weight',
	wdth: 'width',
	ital: 'italic',
	slnt: 'slant',
};

const buffersEqual = (left: Uint8Array, right: Uint8Array): boolean => {
	if (left.byteLength !== right.byteLength) return false;
	return left.every((value, index) => value === right[index]);
};

/** Convert Glypht style values into Fontsource weight/style metadata. */
const extractFontStyle = (
	styleValues: StyleValues,
): { weight: number; style: FontStyle } => {
	const weight = extractStyleValue(styleValues.weight);
	const italicValue = extractStyleValue(styleValues.italic);
	const slantValue = extractStyleValue(styleValues.slant);

	if (italicValue > 0) {
		return { weight, style: 'italic' };
	}

	if (slantValue !== 0) {
		const style = `oblique ${formatSlantValue({
			min: slantValue,
			max: slantValue,
		})}` as FontStyle;

		return { weight, style };
	}

	return { weight, style: 'normal' };
};

/**
 * Build packaged font assets and matching CSS from raw font buffers.
 */
export const buildFont = async (
	ctx: FontContext,
	config: FontBuildConfig,
	options: {
		css?: Pick<CSSOptions, 'display' | 'resolver'>;
		onProgress?: (progress: number) => unknown;
	} = {},
): Promise<FontBuildResult> => {
	const { glyphtContext, compressionContext } = ctx;

	const sources = [...new Set(config.targets.map((target) => target.source))];
	const loaded = new Map<Uint8Array, FontRef[]>();
	const familyId = config.id ?? normalizeKebabCase(config.family);
	const keepAllCharacters = config.characters === 'all';
	const requestedFormats = new Set(config.formats ?? ['woff2']);
	const exportFormats = {
		woff: requestedFormats.has('woff'),
		woff2: requestedFormats.has('woff2'),
	};

	// Determine which formats to export based on config and availability.
	const assetFormats: WebFontFormat[] = [];
	if (exportFormats.woff2) {
		assetFormats.push('woff2');
	}
	if (exportFormats.woff) {
		assetFormats.push('woff');
	}

	const characterSets = new Map(
		(config.characters === 'all' ? [] : config.characters).map((set, index) => [
			`fontsource-${index + 1}`,
			{ ...set, sliceIndex: set.sliceIndex ?? 0 },
		]),
	);
	if (!keepAllCharacters && characterSets.size === 0)
		throw new Error('At least one character subset is required');
	const includeCharacters = [...characterSets].map(([name, set]) => ({
		name,
		includeUnicodeRanges: set.codepoints,
	}));
	const fullCharacterSet = {
		subset: 'full',
		sliceIndex: 0,
		codepoints: [] as number[],
	};
	const variableConfig: VariableAxisConfig = {};
	for (const target of config.targets) {
		if (target.type === 'variable') Object.assign(variableConfig, target.axes);
	}
	// Generate a unique key for each face based on its defining properties.
	const getFaceKey = (
		face: Pick<
			FontFace,
			'subset' | 'weight' | 'style' | 'axisKey' | 'sliceIndex'
		>,
	) =>
		[
			face.subset,
			face.weight,
			face.style,
			face.axisKey ?? '',
			face.sliceIndex,
		].join('|');

	// Export fonts for each axis combination and build corresponding CSS faces.
	const fontAssets = new Map<string, FontAsset>();
	const faceMap = new Map<string, FontFace>();

	try {
		for (const source of sources) {
			loaded.set(
				source,
				await glyphtContext.loadFonts([await normalizeFontBuffer(ctx, source)]),
			);
		}
		for (const [targetIndex, target] of config.targets.entries()) {
			const fontRefs = loaded.get(target.source);
			if (fontRefs?.length !== 1)
				throw new Error('Expected one face per build source');
			const sourceWeight = fontRefs[0].styleValues.weight;
			if (
				target.type === 'static' &&
				(sourceWeight.type === 'single'
					? target.weight !== sourceWeight.value
					: target.weight < sourceWeight.value.min ||
						target.weight > sourceWeight.value.max)
			) {
				throw new Error(
					`Source does not support requested weight ${target.weight}`,
				);
			}
			const isVariableFont = target.type === 'variable';
			const axisKey = target.type === 'variable' ? target.axisKey : undefined;
			const axisConfig =
				target.type === 'variable'
					? pickAxisConfig(target.axes, target.axisKey)
					: undefined;
			const familySettings: FamilySettings[] = sortFontsIntoFamilies(
				fontRefs,
			).map((family) => {
				const styleValues: Partial<
					Record<keyof StyleValues, SubsetAxisSetting>
				> = {};
				const axes: Record<string, SubsetAxisSetting> = {};
				// Glypht preserves unspecified axes. Pin defaults before retaining the requested bundle.
				for (const [key, value] of Object.entries(fontRefs[0].styleValues)) {
					styleValues[key as keyof StyleValues] = {
						type: 'single',
						value: extractStyleValue(value),
					};
				}
				for (const axis of family.axes)
					axes[axis.tag] = { type: 'single', value: axis.defaultValue };
				if (target.type === 'static')
					styleValues.weight = { type: 'single', value: target.weight };
				const italic = fontRefs[0].styleValues.italic;
				const slant = fontRefs[0].styleValues.slant;
				if (italic.type === 'variable') {
					styleValues.italic = {
						type: 'single',
						value: target.style === 'italic' ? italic.value.max : 0,
					};
				} else if (slant.type === 'variable') {
					const { min, max, defaultValue } = slant.value;
					const upright = min <= 0 && max >= 0 ? 0 : defaultValue;
					const tilted =
						Math.abs(min - upright) > Math.abs(max - upright) ? min : max;
					styleValues.slant = {
						type: 'single',
						value: target.style === 'normal' ? upright : tilted,
					};
				} else if (
					formatStyle(extractFontStyle(fontRefs[0].styleValues).style) !==
					formatStyle(target.style)
				) {
					throw new Error(
						`Source does not support requested style ${target.style}`,
					);
				}
				for (const [tag, axis] of Object.entries(axisConfig ?? {})) {
					if (!axis) continue;
					const setting: SubsetAxisSetting = {
						type: 'variable',
						value: { min: Number(axis.min), max: Number(axis.max) },
					};
					const key = VARIABLE_STYLE_AXIS_MAP[tag];
					if (key) styleValues[key as keyof StyleValues] = setting;
					else axes[tag] = setting;
				}
				return {
					fonts: family.fonts,
					enableSubsetting: true,
					styleValues,
					axes,
					features: config.featureSettings ?? {},
					includeCharacters: keepAllCharacters ? 'all' : includeCharacters,
				};
			});
			const exportedFonts = await exportFonts(
				compressionContext,
				familySettings,
				{
					formats: exportFormats,
					woff2Compression: 11, // Max
					woffCompression: 15, // Max
					onProgress: (progress) =>
						options.onProgress?.(
							(targetIndex + progress) / config.targets.length,
						),
				},
			);

			const variableWeight = axisConfig?.wght
				? formatAxisValue(axisConfig.wght)
				: undefined;

			const variableStretch =
				axisKey && axisConfig ? getFaceStretch(axisKey, axisConfig) : null;

			for (const exported of exportedFonts) {
				const { weight, style } = extractFontStyle(exported.font.styleValues);

				// Glypht omits charset names when exactly one selection is exported.
				const charsetName = exported.charsetNameOrIndex;
				const characterSet = keepAllCharacters
					? fullCharacterSet
					: typeof charsetName === 'string'
						? characterSets.get(charsetName)
						: charsetName === null && characterSets.size === 1
							? characterSets.values().next().value
							: undefined;
				if (!characterSet)
					throw new Error('Exported font has no matching character selection');

				const { subset: subsetName, sliceIndex } = characterSet;
				const unicodeRange = keepAllCharacters
					? ''
					: codepointsToRangeString(
							characterSet.codepoints.filter((point) =>
								exported.font.unicodeRanges.some((range) =>
									typeof range === 'number'
										? range === point
										: range[0] <= point && point <= range[1],
								),
							),
						);
				if (!keepAllCharacters && !unicodeRange) continue;

				const faceStyle =
					axisKey && axisConfig
						? getFaceStyle(axisKey, style, axisConfig)
						: style;

				for (const format of assetFormats) {
					const content = exported.data[format];
					if (!content) continue;

					const filename =
						isVariableFont && axisKey
							? generateVariableFilename(
									familyId,
									subsetName,
									axisKey,
									style,
									sliceIndex,
									format,
								)
							: generateStaticFilename(
									familyId,
									subsetName,
									weight,
									style,
									sliceIndex,
									format,
								);

					const assetFilename = `files/${filename}`;
					const existingAsset = fontAssets.get(assetFilename);
					if (existingAsset && !buffersEqual(existingAsset.content, content)) {
						throw new Error(
							`Multiple distinct fonts would be written to ${assetFilename}`,
						);
					}
					if (!existingAsset) {
						const asset = { filename: assetFilename, format, content };
						fontAssets.set(assetFilename, asset);
					}

					const faceWeight = isVariableFont
						? (variableWeight ?? `${weight}`)
						: weight;

					// Collapse per-format exports back into one CSS face.
					const faceKey = getFaceKey({
						subset: subsetName,
						weight: faceWeight,
						style: faceStyle,
						axisKey,
						sliceIndex,
					});

					const face: FontFace = faceMap.get(faceKey) ?? {
						subset: subsetName,
						weight: faceWeight,
						style: faceStyle,
						isVariable: isVariableFont,
						unicodeRange,
						sources: [],
						axisKey,
						stretch: variableStretch,
						sliceIndex,
					};

					if (
						!face.sources.some(
							(source) =>
								source.format === format && source.filename === filename,
						)
					) {
						face.sources.push({ format, filename });
					}
					faceMap.set(faceKey, face);
				}
			}
		}
	} finally {
		await Promise.all(
			[...loaded.values()].flat().map((font) => font.destroy()),
		);
	}

	// Convert the face map into an array for CSS generation.
	const faces = Array.from(faceMap.values());

	const cssAssets = generateCSSAssets(config.family, faces, {
		...options.css,
		variable: config.targets.some((target) => target.type === 'variable')
			? variableConfig
			: undefined,
	});

	return { css: cssAssets, fonts: [...fontAssets.values()], faces };
};
