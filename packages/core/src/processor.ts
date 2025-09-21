import type { FontRef, SubsetAxisSetting } from '@glypht/core';
import { asConcur, flatMap, mapConcur, pipe, reduceConcur, toArray } from 'lfi';
import type { FontContext } from './context';
import { generateStaticCSS, generateVariableCSS } from './css';
import { generateStaticFilename, generateVariableFilename } from './filename';
import { generateSubsetData } from './subsets';
import type {
	FontBuildConfig,
	FontPackage,
	FontStyle,
	Format,
	OutputAsset,
	ProcessedVariant,
	ProcessingContext,
	SubsetDefinition,
	VariableAxisConfig,
} from './types';
import { extractStyleValue, normalizeKebabCase } from './utils';

// ProcessingJob represents a single unit of work to process a font slice in a specific format.
interface ProcessingJob {
	font: FontRef;
	subsetName: string;
	codepoints: number[];
	sliceIndex: number;
	weight: number;
	style: FontStyle;
	format: Format;
	targetWeight?: number;
	variableConfig?: VariableAxisConfig;
	axisKey?: string;
}

/**
 * Extracts weight and style information from a font reference.
 */
const extractFontStyle = (
	font: FontRef,
): { weight: number; style: FontStyle } => {
	const weight =
		font.styleValues.weight.type === 'single'
			? font.styleValues.weight.value
			: extractStyleValue(font.styleValues.weight.value);

	const italicValue = extractStyleValue(font.styleValues.italic.value);
	const slantValue = extractStyleValue(font.styleValues.slant.value);

	// Determine style with priority italic > oblique > normal
	const style: FontStyle =
		italicValue > 0
			? 'italic'
			: slantValue !== 0
				? (`oblique ${Math.round(Math.abs(slantValue) * 10) / 10}deg` as FontStyle)
				: 'normal';

	return { weight, style };
};

/**
 * Determines the weights and styles to process based on config and available fonts.
 */
const determineProcessingTargets = (
	fontRefs: FontRef[],
	config: FontBuildConfig,
): { weightsToProcess: number[]; stylesToProcess: FontStyle[] } => {
	if (
		config.type === 'static' &&
		config.weights?.length &&
		config.styles?.length
	) {
		return {
			weightsToProcess: config.weights,
			stylesToProcess: config.styles,
		};
	}

	const availableWeights: Set<number> = new Set();
	const availableStyles: Set<FontStyle> = new Set();

	for (const font of fontRefs) {
		const { style } = extractFontStyle(font);
		availableStyles.add(style);

		if (font.styleValues.weight.type === 'single') {
			availableWeights.add(font.styleValues.weight.value);
		} else {
			const { min, max, defaultValue } = font.styleValues.weight.value;
			availableWeights.add(min);
			availableWeights.add(max);

			if (defaultValue) {
				availableWeights.add(defaultValue);
			}

			// Add standard CSS weights (100-1000) within the font's range
			for (let w = 100; w <= 1000; w += 100) {
				if (w >= min && w <= max) {
					availableWeights.add(w);
				}
			}
		}
	}

	return {
		weightsToProcess:
			config.type === 'static' && config.weights?.length
				? config.weights
				: Array.from(availableWeights).sort((a, b) => a - b),

		stylesToProcess:
			config.type === 'static' && config.styles?.length
				? config.styles
				: Array.from(availableStyles),
	};
};

/**
 * Determines the axis key for variable font filename generation.
 */
const determineAxisKey = (
	variableConfig: VariableAxisConfig,
	configAxisKey?: string,
): string => {
	if (configAxisKey) return configAxisKey.toLowerCase();

	const standardAxisSet = new Set(['wght', 'wdth', 'slnt', 'opsz', 'ital']);
	const standard: string[] = [];
	const custom: string[] = [];

	for (const axis in variableConfig) {
		if (variableConfig[axis]) {
			if (standardAxisSet.has(axis)) {
				standard.push(axis);
			} else {
				custom.push(axis);
			}
		}
	}

	if (standard.length === 0 && custom.length === 0) return 'wght'; // Fallback

	if (custom.length > 0) {
		// If custom axes are present, the key is 'full' or the single custom axis name.
		return standard.length > 0 || custom.length > 1 ? 'full' : custom[0];
	}

	// Otherwise, the key is 'standard' or the single standard axis name.
	return standard.length > 1 ? 'standard' : standard[0];
};

const standardAxisPropertyMap: Record<string, keyof FontRef['styleValues']> = {
	wght: 'weight',
	slnt: 'slant',
	wdth: 'width',
	ital: 'italic',
};

const buildAxisValues = (
	font: FontRef,
	variableConfig?: VariableAxisConfig,
	targetWeight?: number,
): SubsetAxisSetting[] => {
	const axisValues: SubsetAxisSetting[] = [];

	if (variableConfig) {
		for (const [tag, config] of Object.entries(variableConfig)) {
			if (config) {
				let defaultValue = config.min;

				const styleKey = standardAxisPropertyMap[tag];
				if (styleKey) {
					const styleValue = font.styleValues[styleKey];
					if (styleValue?.type === 'variable') {
						defaultValue = styleValue.value.defaultValue;
					}
				}

				axisValues.push({
					type: 'variable',
					tag,
					value: {
						min: config.min,
						defaultValue,
						max: config.max,
					},
				});
			}
		}
	} else if (targetWeight && font.styleValues.weight.type === 'variable') {
		// Static processing of a variable font at a single weight
		axisValues.push({ type: 'single', tag: 'wght', value: targetWeight });
	}

	return axisValues;
};

/**
 * Processes a single font slice for a specific format and generates a variant.
 */
const processSlice = async (
	ctx: ProcessingContext,
	font: FontRef,
	subsetName: string,
	codepoints: number[],
	sliceIndex: number,
	weight: number,
	style: FontStyle,
	format: Format,
	targetWeight?: number,
	variableConfig?: VariableAxisConfig,
	axisKey?: string,
): Promise<ProcessedVariant> => {
	const { compressionContext, familyId } = ctx;
	const axisValues = buildAxisValues(font, variableConfig, targetWeight);

	const subsettedFont = await font.subset({
		axisValues,
		features: ctx.config.featureSettings,
		unicodeRanges: { named: [], custom: codepoints },
	});

	const content = await compressionContext.compressFromTTF(
		subsettedFont.data,
		format,
		11,
	);

	if (variableConfig && axisKey) {
		return {
			type: 'variable',
			weight,
			style,
			subset: subsetName,
			sliceIndex,
			content,
			filename: generateVariableFilename(
				familyId,
				subsetName,
				axisKey,
				style,
				sliceIndex,
				format as Format,
			),
			variable: variableConfig,
			axisKey,
		} as ProcessedVariant;
	} else {
		return {
			type: 'static',
			weight,
			style,
			subset: subsetName,
			sliceIndex,
			content,
			filename: generateStaticFilename(
				familyId,
				subsetName,
				weight,
				style,
				sliceIndex,
				format as Format,
			),
		} as ProcessedVariant;
	}
};

/**
 * Creates processing jobs for a subset and its potential slices across all formats.
 */
const createJobsForSubset = (
	font: FontRef,
	subsetName: string,
	subsetDef: SubsetDefinition,
	weight: number,
	style: FontStyle,
	formats: Format[],
	targetWeight?: number,
	variableConfig?: VariableAxisConfig,
	axisKey?: string,
): ProcessingJob[] => {
	const baseJob = {
		font,
		subsetName,
		weight,
		style,
		targetWeight,
		variableConfig,
		axisKey,
	};

	const sliceJobs =
		subsetDef.type === 'sliced'
			? subsetDef.slices.map((slice) => ({
					...baseJob,
					codepoints: slice.codepoints,
					sliceIndex: slice.index,
				}))
			: [{ ...baseJob, codepoints: subsetDef.codepoints, sliceIndex: 0 }];

	// Expand each slice job across all formats using flatMap.
	//
	// e.g. for 2 slices and 2 formats, this creates 4 jobs [slice1-format1, slice1-format2, slice2-format1, slice2-format2]
	return pipe(
		sliceJobs,
		flatMap((job) =>
			formats.map((format) => ({
				...job,
				format,
			})),
		),
		Array.from,
	) as ProcessingJob[];
};

/**
 * Generates all CSS assets for the processed variants.
 */
const generateAllCssAssets = (
	ctx: ProcessingContext,
	allVariants: ProcessedVariant[],
	weightsToProcess: number[],
	stylesToProcess: FontStyle[],
): OutputAsset[] => {
	const { config, subsets } = ctx;
	const cssAssets: OutputAsset[] = [];

	if (config.type === 'variable') {
		const cssContent = generateVariableCSS(config.family, allVariants, subsets);
		if (cssContent) {
			cssAssets.push({
				filename: 'index.css',
				content: new TextEncoder().encode(cssContent),
			});
		}
	} else {
		for (const weight of weightsToProcess) {
			for (const style of stylesToProcess) {
				const cssContent = generateStaticCSS(
					config.family,
					weight,
					style,
					allVariants,
					subsets,
				);
				if (cssContent) {
					const filename =
						style === 'normal' ? `${weight}.css` : `${weight}-italic.css`;
					cssAssets.push({
						filename,
						content: new TextEncoder().encode(cssContent),
					});
				}
			}
		}

		// Add index.css pointing to the weight closest to 400
		if (weightsToProcess.length > 0) {
			const defaultWeight = weightsToProcess.reduce((closest, current) => {
				const closestDiff = Math.abs(closest - 400);
				const currentDiff = Math.abs(current - 400);

				// If current is closer, or equally close and heavier, it's the new best.
				if (
					currentDiff < closestDiff ||
					(currentDiff === closestDiff && current > closest)
				) {
					return current;
				}
				return closest;
			});

			const indexCss = cssAssets.find(
				(asset) => asset.filename === `${defaultWeight}.css`,
			);

			if (indexCss) {
				cssAssets.push({ filename: 'index.css', content: indexCss.content });
			}
		}
	}
	return cssAssets;
};

/**
 * Processes font files and generates web-optimized font assets with CSS.
 */
export const buildFont = async (
	ctx: FontContext,
	fontBuffers: Uint8Array[],
	config: FontBuildConfig,
): Promise<FontPackage> => {
	const { glyphtContext, compressionContext } = ctx;

	const fontRefs = await glyphtContext.loadFonts(fontBuffers);
	const familyId = normalizeKebabCase(config.family);
	const subsets = generateSubsetData(config);
	const isVariableFont = config.type === 'variable';

	const processingCtx: ProcessingContext = {
		familyId,
		config,
		compressionContext,
		subsets,
	};

	const { weightsToProcess, stylesToProcess } = determineProcessingTargets(
		fontRefs,
		config,
	);

	// Pre-calculate the axis key once if it's a variable font build
	const variableConfig = isVariableFont ? config.variable : undefined;
	const resolvedAxisKey = isVariableFont
		? determineAxisKey(config.variable, config.axisKey)
		: undefined;

	// Create a flat list of all processing jobs to be done
	const allProcessingJobs = fontRefs.flatMap((font) => {
		const { weight: fontWeight, style: fontStyle } = extractFontStyle(font);

		// Skip this font file if its style is not requested
		if (!stylesToProcess.includes(fontStyle)) {
			return [];
		}

		// Determine which target weights this font file can satisfy
		const applicableWeights = isVariableFont
			? [{ weight: fontWeight, style: fontStyle, targetWeight: undefined }]
			: weightsToProcess
					.filter(
						(w) =>
							font.styleValues.weight.type === 'variable' ||
							font.styleValues.weight.value === w,
					)
					.map((targetWeight) => ({
						weight: targetWeight,
						style: fontStyle,
						targetWeight,
					}));

		// For each applicable combination, create jobs for all subsets
		return applicableWeights.flatMap(({ weight, style, targetWeight }) =>
			config.subsets.flatMap((subsetName) => {
				const subsetDef = subsets.get(subsetName);
				return subsetDef
					? createJobsForSubset(
							font,
							subsetName,
							subsetDef,
							weight,
							style,
							config.formats,
							targetWeight,
							variableConfig,
							resolvedAxisKey,
						)
					: [];
			}),
		);
	});

	// Execute all jobs concurrently using lfi
	const processJob = async (
		job: ProcessingJob,
	): Promise<ProcessedVariant | null> => {
		try {
			return await processSlice(
				processingCtx,
				job.font,
				job.subsetName,
				job.codepoints,
				job.sliceIndex,
				job.weight,
				job.style,
				job.format,
				job.targetWeight,
				job.variableConfig,
				job.axisKey,
			);
		} catch (error) {
			const sliceInfo = job.sliceIndex > 0 ? ` slice ${job.sliceIndex}` : '';
			console.warn(
				`Failed to process ${job.variableConfig ? 'variable' : 'static'} font${sliceInfo} for ${job.subsetName} (${job.format}):`,
				error,
			);
			return null; // Return null for failed jobs
		}
	};

	const allVariants = (
		await pipe(
			asConcur(allProcessingJobs),
			mapConcur(processJob),
			reduceConcur(toArray()),
		)
	).filter((variant): variant is ProcessedVariant => variant !== null);

	const cssAssets = generateAllCssAssets(
		processingCtx,
		allVariants,
		weightsToProcess,
		stylesToProcess,
	);

	const fontAssets = allVariants.map((variant) => ({
		filename: `files/${variant.filename}`,
		content: variant.content,
	}));

	return { css: cssAssets, fonts: fontAssets };
};
