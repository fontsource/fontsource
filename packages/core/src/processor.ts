import {
	exportFonts,
	type FamilySettings,
	type SubsetAxisSetting,
	sortFontsIntoFamilies,
} from '@glypht/bundler-utils';
import type { FontRef, StyleValues } from '@glypht/core';
import type { FontContext } from './context';
import type { CSSOptions } from './css';
import { generateFaceCSSAssets } from './css/assets';
import { normalizeFontBuffer } from './normalize';
import { generateSubsetData } from './subsets';
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
import {
	getFaceStretch,
	getFaceStyle,
	getRequestedAxisKeys,
	pickAxisConfig,
} from './utils/variable';

const VARIABLE_STYLE_AXIS_MAP: Partial<Record<string, string>> = {
	wght: 'weight',
	wdth: 'width',
	ital: 'italic',
	slnt: 'slant',
};

const STYLE_VALUE_AXIS_MAP: Record<keyof StyleValues, string> = {
	weight: 'wght',
	width: 'wdth',
	italic: 'ital',
	slant: 'slnt',
};

const pinUnusedStyleAxes = (
	styleValues: Partial<StyleValues>,
): Partial<Record<keyof StyleValues, SubsetAxisSetting>> => {
	const settings = { ...styleValues };

	for (const styleKey of ['width', 'slant'] as const) {
		const styleValue = styleValues[styleKey];
		if (styleValue?.type === 'variable') {
			settings[styleKey] = {
				type: 'single',
				value: styleValue.value.defaultValue,
			};
		}
	}

	return settings;
};

const getSourceVariableConfig = (fonts: FontRef[]): VariableAxisConfig => {
	const axes: VariableAxisConfig = {};
	const mergeAxis = (tag: string, min: number, max: number) => {
		const current = axes[tag];
		axes[tag] = current
			? {
					min: Math.min(Number(current.min), min),
					max: Math.max(Number(current.max), max),
				}
			: { min, max };
	};

	for (const font of fonts) {
		for (const [styleKey, tag] of Object.entries(STYLE_VALUE_AXIS_MAP)) {
			const styleValue = font.styleValues[styleKey as keyof StyleValues];
			if (styleValue.type === 'variable') {
				mergeAxis(tag, styleValue.value.min, styleValue.value.max);
			}
		}

		for (const axis of font.axes) {
			mergeAxis(axis.tag, axis.min, axis.max);
		}
	}

	return axes;
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
	fontBuffers: Uint8Array[],
	config: FontBuildConfig,
	options: {
		css?: Pick<CSSOptions, 'display' | 'resolver'>;
		onProgress?: (progress: number) => unknown;
	} = {},
): Promise<FontBuildResult> => {
	const { glyphtContext, compressionContext } = ctx;

	const normalizedBuffers = await Promise.all(
		fontBuffers.map((buffer) => normalizeFontBuffer(ctx, buffer)),
	);
	const fontRefs = await glyphtContext.loadFonts(normalizedBuffers);
	const familyId = config.id ?? normalizeKebabCase(config.family);
	const characterConfig =
		config.characters === 'all' ? undefined : config.characters;
	const keepAllCharacters = characterConfig === undefined;
	const subsets: ReturnType<typeof generateSubsetData> = keepAllCharacters
		? new Map()
		: generateSubsetData(characterConfig);
	const slicing = characterConfig?.slicing
		? generateSubsetData({
				subsets: [characterConfig.slicing.subset],
				subsetSources: {
					[characterConfig.slicing.subset]: characterConfig.slicing.source,
				},
			}).get(characterConfig.slicing.subset)
		: undefined;
	const isVariableFont = config.type === 'variable';
	const variableConfig =
		config.type !== 'variable'
			? undefined
			: (config.variable ?? getSourceVariableConfig(fontRefs));

	const families = sortFontsIntoFamilies(fontRefs);
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

	type CharacterSet = Pick<FontFace, 'subset' | 'unicodeRange' | 'sliceIndex'>;
	const characterSets = new Map<string, CharacterSet>();
	const includeCharacters: Array<{
		name: string;
		includeUnicodeRanges: number[];
	}> = [];
	const addCharacterSet = (
		characterSet: CharacterSet,
		codepoints: number[],
	) => {
		const name = `fontsource-${characterSets.size + 1}`;
		characterSets.set(name, characterSet);
		includeCharacters.push({ name, includeUnicodeRanges: codepoints });
	};

	const addSubset = (
		subsetName: string,
		definition: NonNullable<ReturnType<typeof subsets.get>>,
	) => {
		if (definition.type === 'range') {
			addCharacterSet(
				{
					subset: subsetName,
					unicodeRange: definition.unicodeRange,
					sliceIndex: 0,
				},
				definition.codepoints,
			);
			return;
		}

		for (const slice of definition.slices) {
			addCharacterSet(
				{
					subset: subsetName,
					unicodeRange: codepointsToRangeString(slice.codepoints),
					sliceIndex: slice.index,
				},
				slice.codepoints,
			);
		}
	};

	for (const subsetName of characterConfig?.subsets ?? []) {
		const definition = subsets.get(subsetName);
		if (definition) addSubset(subsetName, definition);
	}

	if (characterConfig?.slicing) {
		if (slicing?.type !== 'sliced') {
			throw new Error(
				`Slicing source for "${characterConfig.slicing.subset}" must contain slices`,
			);
		}
		addSubset(characterConfig.slicing.subset, slicing);
	}
	if (!keepAllCharacters && characterSets.size === 0) {
		throw new Error(
			'At least one character subset or slicing source is required',
		);
	}

	const fullCharacterSet: CharacterSet = {
		subset: 'full',
		unicodeRange: '',
		sliceIndex: 0,
	};
	const defaultCharacterSet = keepAllCharacters
		? fullCharacterSet
		: characterSets.values().next().value;

	// Build Glypht FamilySettings for each family.
	const buildFamilySettings = (
		variableConfig?: VariableAxisConfig,
	): FamilySettings[] =>
		families.map((family) => {
			let fonts = isVariableFont
				? family.fonts
				: family.fonts.map(({ font, styleValues }) => ({
						font,
						styleValues: pinUnusedStyleAxes(styleValues),
					}));
			const styleValues: Partial<Record<string, SubsetAxisSetting>> =
				isVariableFont ? {} : pinUnusedStyleAxes(family.styleValues);
			const axes: Partial<Record<string, SubsetAxisSetting>> = {};

			if (isVariableFont && variableConfig) {
				for (const [tag, axis] of Object.entries(variableConfig)) {
					if (!axis) continue;

					const styleKey = VARIABLE_STYLE_AXIS_MAP[tag];
					const setting: SubsetAxisSetting = {
						type: 'variable',
						value: { min: Number(axis.min), max: Number(axis.max) },
					};

					// If this is a known axis, map it to a style value. Otherwise, treat it as a custom axis.
					if (styleKey) {
						styleValues[styleKey] = setting;
					} else {
						axes[tag] = setting;
					}
				}

				// Glypht preserves unspecified axes, so pin every source axis that
				// does not belong to this published bundle.
				for (const [styleKey, tag] of Object.entries(STYLE_VALUE_AXIS_MAP)) {
					const styleValue = family.styleValues[styleKey as keyof StyleValues];
					if (styleValue?.type === 'variable' && !variableConfig[tag]) {
						styleValues[styleKey] = {
							type: 'single',
							value: styleValue.value.defaultValue,
						};
					}
				}
				for (const { tag, defaultValue } of family.axes) {
					if (!variableConfig[tag]) {
						axes[tag] = { type: 'single', value: defaultValue };
					}
				}
			} else {
				// Glypht preserves unspecified axes, so a static build must pin
				// every custom axis it does not instance.
				for (const { tag, defaultValue } of family.axes) {
					axes[tag] = { type: 'single', value: defaultValue };
				}

				// If weights aren't explicitly configured, extract them from the font metadata.
				let weights = config.weights;
				if (!weights || weights.length === 0) {
					weights = Array.from(
						new Set(
							family.fonts.map((f) => {
								const w = f.font.styleValues.weight;
								return w.type === 'single' ? w.value : w.value.defaultValue;
							}),
						),
					);
				}

				// If styles aren't explicitly configured, extract them from the font metadata. Variable fonts need to be treated differently
				// since style axes like italic/slant may be represented as variable axes rather than discrete styles.
				let styles = config.styles;
				if (!styles || styles.length === 0 || config.type === 'variable') {
					styles = Array.from(
						new Set(
							family.fonts.map(
								(f) => extractFontStyle(f.font.styleValues).style,
							),
						),
					);
				}

				styleValues.weight = {
					type: 'multiple',
					value: { ranges: weights },
				};

				const requestedStyles = new Set(styles.map(formatStyle));
				const hasItalic = requestedStyles.has('italic');
				const hasNormal = requestedStyles.has('normal');
				const italicAxis = family.styleValues.italic;
				const slantAxis = family.styleValues.slant;
				const styleSetting = (
					upright: number,
					italic: number,
				): SubsetAxisSetting =>
					hasItalic && hasNormal
						? {
								type: 'multiple',
								value: { ranges: [upright, italic] },
							}
						: { type: 'single', value: hasItalic ? italic : upright };

				// Use the source endpoints instead of assuming every style axis is
				// encoded as ital 0–1 or a particular slant angle.
				if (slantAxis?.type === 'variable' && italicAxis?.type !== 'variable') {
					const { min, defaultValue, max } = slantAxis.value;
					const upright = min <= 0 && max >= 0 ? 0 : defaultValue;
					const italic =
						Math.abs(min - upright) > Math.abs(max - upright) ? min : max;
					styleValues.slant = styleSetting(upright, italic);
				} else if (italicAxis?.type === 'variable') {
					styleValues.italic = styleSetting(0, italicAxis.value.max);
				} else {
					fonts = fonts.filter(({ font }) =>
						requestedStyles.has(
							formatStyle(extractFontStyle(font.styleValues).style),
						),
					);
				}
			}

			return {
				fonts,
				enableSubsetting: true,
				styleValues,
				axes,
				features: config.featureSettings ?? {},
				includeCharacters: keepAllCharacters ? 'all' : includeCharacters,
			};
		});

	// For variable fonts, determine which axis combinations to export based on the config. For static fonts, just export once.
	const variableAxisKeys =
		config.type !== 'variable'
			? [undefined]
			: keepAllCharacters && !config.axisKeys
				? ['full']
				: getRequestedAxisKeys(variableConfig ?? {}, config.axisKeys);

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
	const fontAssets: FontAsset[] = [];
	const fontAssetsByName = new Map<string, FontAsset>();
	const faceMap = new Map<string, FontFace>();

	for (const axisKey of variableAxisKeys) {
		const axisConfig =
			isVariableFont && variableConfig && axisKey
				? pickAxisConfig(variableConfig, axisKey)
				: undefined;

		const familySettings = buildFamilySettings(axisConfig);
		const exportedFonts = await exportFonts(
			compressionContext,
			familySettings,
			{
				formats: exportFormats,
				woff2Compression: 11, // Max
				woffCompression: 15, // Max
				onProgress: options.onProgress,
			},
		);

		const variableWeight = axisConfig?.wght
			? formatAxisValue(axisConfig.wght)
			: undefined;

		const variableStretch =
			axisKey && axisConfig ? getFaceStretch(axisKey, axisConfig) : null;

		for (const exported of exportedFonts) {
			const { weight, style } = extractFontStyle(exported.font.styleValues);

			const charsetName = exported.charsetNameOrIndex;
			const characterSet = keepAllCharacters
				? fullCharacterSet
				: typeof charsetName === 'string'
					? characterSets.get(charsetName)
					: defaultCharacterSet;
			if (!characterSet) continue;

			const { subset: subsetName, sliceIndex, unicodeRange } = characterSet;

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
				const existingAsset = fontAssetsByName.get(assetFilename);
				if (existingAsset && !buffersEqual(existingAsset.content, content)) {
					throw new Error(
						`Multiple distinct fonts would be written to ${assetFilename}`,
					);
				}
				if (!existingAsset) {
					const asset = { filename: assetFilename, format, content };
					fontAssets.push(asset);
					fontAssetsByName.set(assetFilename, asset);
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

	// Convert the face map into an array for CSS generation.
	const faces = Array.from(faceMap.values());

	const cssAssets = generateFaceCSSAssets(config.family, faces, {
		...options.css,
		variable: variableConfig,
	});

	return { css: cssAssets, fonts: fontAssets, faces };
};
