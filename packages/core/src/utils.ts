import { formatUnicodeRanges } from '@glypht/bundler-utils';
import type { StyleValue } from '@glypht/core';
import { generateStaticFilename, generateVariableFilename } from './filename';
import type {
	FontConfig,
	FontFace,
	VariableAxisConfig,
	VariableFontAxis,
} from './types';

/** Normalize a family or style label to kebab-case. */
export const normalizeKebabCase = (text: string): string =>
	text.toLowerCase().replace(/\s+/g, '-');

/** Convert codepoints into a CSS `unicode-range` string. */
export const codepointsToRangeString = (
	codepoints: number[] | undefined,
): string => {
	if (!codepoints || codepoints.length === 0) {
		return '';
	}

	const sorted = Array.from(new Set(codepoints)).sort((a, b) => a - b);
	const ranges: (number | [number, number])[] = [];

	let rangeStart = sorted[0] as number;
	for (let i = 1; i <= sorted.length; i++) {
		const current = sorted[i];
		const prev = sorted[i - 1] as number;

		if (current !== prev + 1) {
			if (rangeStart === prev) {
				ranges.push(rangeStart);
			} else {
				ranges.push([rangeStart, prev]);
			}
			rangeStart = current as number;
		}
	}

	return formatUnicodeRanges(ranges).join(', ').toUpperCase();
};

/** Read a numeric style value from static or variable Glypht output. */
export const extractStyleValue = (value: StyleValue | number): number => {
	if (typeof value === 'number') {
		return value;
	}

	if (value.type === 'single') {
		return value.value;
	}

	return value.value.defaultValue;
};

/** Pick the axis bucket for variable filenames and CSS. */
export const determineAxisKey = (
	variableConfig: VariableAxisConfig,
	configAxisKey?: string,
): string => {
	if (configAxisKey) {
		return configAxisKey.toLowerCase();
	}

	const activeAxes = Object.keys(variableConfig).filter(
		(key) => variableConfig[key],
	);

	if (activeAxes.length === 0) {
		return 'wght';
	}

	const standardAxes = ['wght', 'wdth', 'slnt', 'opsz', 'ital'];
	const standard = activeAxes.filter((axis) => standardAxes.includes(axis));
	const custom = activeAxes.filter((axis) => !standardAxes.includes(axis));

	if (custom.length > 0) {
		return standard.length > 0 || custom.length > 1
			? 'full'
			: (custom[0] ?? '');
	}

	return standard.length > 1 ? 'standard' : (standard[0] ?? '');
};

export const formatAxisValue = (axis: VariableFontAxis): string =>
	String(axis.min) === String(axis.max)
		? String(axis.min)
		: `${axis.min} ${axis.max}`;

export const formatStretchValue = (axis: VariableFontAxis): string =>
	String(axis.min) === String(axis.max)
		? `${axis.min}%`
		: `${axis.min}% ${axis.max}%`;

export const findClosestWeight = (weights: number[], target = 400): number => {
	if (weights.length === 0) return target;
	return weights.reduce((closest, current) => {
		const closestDiff = Math.abs(closest - target);
		const currentDiff = Math.abs(current - target);
		return currentDiff < closestDiff ||
			(currentDiff === closestDiff && current > closest)
			? current
			: closest;
	}, weights[0] as number);
};

export const resolveFontFaces = (config: FontConfig): FontFace[] => {
	const {
		id,
		family,
		subsets,
		weights,
		styles,
		unicodeRange = {},
		variable,
		formats = ['woff2'],
	} = config;

	const faces: FontFace[] = [];
	const isVariable = !!variable;
	const familyId = id ?? normalizeKebabCase(family);

	if (isVariable) {
		const axisKey = determineAxisKey(variable);
		const { wght, wdth } = variable;
		const cssWeight = wght ? formatAxisValue(wght) : '400 900';
		const stretch = wdth ? formatStretchValue(wdth) : null;

		for (const subset of subsets) {
			for (const style of styles) {
				faces.push({
					subset,
					weight: cssWeight,
					style,
					isVariable: true,
					unicodeRange: unicodeRange[subset] ?? '',
					sources: formats.map((format) => ({
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
	} else {
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
