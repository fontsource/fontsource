import {
	exportFonts,
	type FamilySettings,
	type SubsetAxisSetting,
	sortFontsIntoFamilies,
} from '@glypht/bundler-utils';
import type { StyleValues } from '@glypht/core';
import type { FontContext } from './context';
import { generateCSSFromFaces } from './css';
import { generateStaticFilename, generateVariableFilename } from './filename';
import { generateSubsetData } from './subsets';
import type {
	FontAsset,
	FontBuildConfig,
	FontFace,
	FontPackage,
	FontStyle,
	Format,
} from './types';
import {
	codepointsToRangeString,
	determineAxisKey,
	extractStyleValue,
	formatAxisValue,
	formatStretchValue,
	normalizeKebabCase,
} from './utils';

/** Convert Glypht style values into Fontsource weight/style metadata. */
const extractFontStyle = (
	styleValues: StyleValues,
): { weight: number; style: FontStyle } => {
	const weight = extractStyleValue(styleValues.weight);
	const italicValue = extractStyleValue(styleValues.italic);
	const slantValue = extractStyleValue(styleValues.slant);

	const style: FontStyle =
		italicValue > 0
			? 'italic'
			: slantValue !== 0
				? (`oblique ${Math.round(Math.abs(slantValue) * 10) / 10}deg` as FontStyle)
				: 'normal';

	return { weight, style };
};

/**
 * Build packaged font assets and matching CSS from raw font buffers.
 *
 * This is the high-level packaging entrypoint for callers that already have
 * font binaries in memory.
 */
export const buildFont = async (
	ctx: FontContext,
	fontBuffers: Uint8Array[],
	config: FontBuildConfig,
): Promise<FontPackage> => {
	const { glyphtContext, compressionContext } = ctx;

	const fontRefs = await glyphtContext.loadFonts(fontBuffers);
	const familyId = config.id ?? normalizeKebabCase(config.family);
	const subsets = generateSubsetData(config);
	const isVariableFont = config.type === 'variable';

	const families = sortFontsIntoFamilies(fontRefs);

	const familySettings: FamilySettings[] = families.map((family) => {
		const includeCharacters = config.subsets.flatMap((subsetName) => {
			const def = subsets.get(subsetName);
			if (!def) return [];

			if (def.type === 'range') {
				return [{ name: subsetName, includeUnicodeRanges: def.codepoints }];
			}
			return def.slices.map((slice) => ({
				name: `${subsetName}-${slice.index}`,
				includeUnicodeRanges: slice.codepoints,
			}));
		});

		const styleValues: Partial<Record<string, SubsetAxisSetting>> = {};
		const axes: Partial<Record<string, SubsetAxisSetting>> = {};

		if (isVariableFont && config.variable) {
			const axisMap: Record<string, string> = {
				wght: 'weight',
				wdth: 'width',
				ital: 'italic',
				slnt: 'slant',
			};

			for (const [tag, axis] of Object.entries(config.variable)) {
				if (!axis) continue;
				const styleKey = axisMap[tag];
				const setting: SubsetAxisSetting = {
					type: 'variable',
					value: { min: Number(axis.min), max: Number(axis.max) },
				};
				if (styleKey) {
					styleValues[styleKey] = setting;
				} else {
					axes[tag] = setting;
				}
			}
		} else {
			const weights = config.weights?.length
				? config.weights
				: Array.from(
						new Set(
							family.fonts.map((f) => {
								const w = f.font.styleValues.weight;
								return w.type === 'single' ? w.value : w.value.defaultValue;
							}),
						),
					);

			const styles =
				config.type === 'static' && config.styles?.length
					? config.styles
					: Array.from(
							new Set(
								family.fonts.map(
									(f) => extractFontStyle(f.font.styleValues).style,
								),
							),
						);

			styleValues.weight = {
				type: 'multiple',
				value: { ranges: weights },
			};

			const hasItalic = styles.some(
				(s) => s === 'italic' || s.startsWith('oblique'),
			);
			const hasNormal = styles.includes('normal');

			if (hasItalic && hasNormal) {
				styleValues.italic = { type: 'multiple', value: { ranges: [0, 1] } };
			} else if (hasItalic) {
				styleValues.italic = { type: 'single', value: 1 };
			} else {
				styleValues.italic = { type: 'single', value: 0 };
			}
		}

		return {
			fonts: family.fonts,
			enableSubsetting: true,
			styleValues,
			axes,
			features: config.featureSettings,
			includeCharacters,
		};
	});

	const exportedFonts = await exportFonts(compressionContext, familySettings, {
		formats: {
			woff: config.formats?.includes('woff') ?? false,
			woff2: config.formats?.includes('woff2') ?? true,
		},
		woff2Compression: 11,
		woffCompression: 15,
	});

	// Resolve variable metadata once per build.
	const resolvedAxisKey =
		config.type === 'variable' && config.variable
			? determineAxisKey(config.variable, config.axisKey)
			: undefined;

	const variableWeight =
		config.type === 'variable' && config.variable?.wght
			? formatAxisValue(config.variable.wght)
			: undefined;

	const variableStretch =
		config.type === 'variable' && config.variable?.wdth
			? formatStretchValue(config.variable.wdth)
			: undefined;

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

	const fontAssets: FontAsset[] = [];
	const faceMap = new Map<string, FontFace>();

	for (const exported of exportedFonts) {
		const { weight, style } = extractFontStyle(exported.font.styleValues);

		const charsetName = (exported.charsetNameOrIndex ??
			config.subsets[0]) as string;
		if (!charsetName) continue;

		const sliceMatch = charsetName.match(/^(.+)-(\d+)$/);
		const subsetName = sliceMatch
			? (sliceMatch[1] ?? charsetName)
			: charsetName;
		const sliceIndex = sliceMatch ? parseInt(sliceMatch[2] ?? '0', 10) : 0;

		const subsetDef = subsets.get(subsetName);
		if (!subsetDef) continue;

		const unicodeRange =
			subsetDef.type === 'range'
				? subsetDef.unicodeRange
				: codepointsToRangeString(
						subsetDef.slices.find((s) => s.index === sliceIndex)?.codepoints,
					);

		const formats: Format[] = ['woff2', 'woff'];
		for (const format of formats) {
			const content = exported.data[format];
			if (!content) continue;

			const filename =
				isVariableFont && resolvedAxisKey
					? generateVariableFilename(
							familyId,
							subsetName,
							resolvedAxisKey,
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

			fontAssets.push({ filename: `files/${filename}`, format, content });

			const faceWeight = isVariableFont
				? (variableWeight ?? `${weight}`)
				: weight;
			// Collapse per-format exports back into one CSS face.
			const faceKey = getFaceKey({
				subset: subsetName,
				weight: faceWeight,
				style,
				axisKey: resolvedAxisKey,
				sliceIndex,
			});
			const face = faceMap.get(faceKey) ?? {
				subset: subsetName,
				weight: faceWeight,
				style,
				isVariable: isVariableFont,
				unicodeRange: unicodeRange ?? '',
				sources: [],
				axisKey: resolvedAxisKey,
				stretch: variableStretch ?? null,
				sliceIndex,
			};

			face.sources.push({ format, filename });
			faceMap.set(faceKey, face);
		}
	}

	const faces = Array.from(faceMap.values());
	const cssAssets = generateCSSFromFaces(config.family, faces, {
		variable: config.type === 'variable' ? config.variable : undefined,
	});

	return { css: cssAssets, fonts: fontAssets, faces };
};
