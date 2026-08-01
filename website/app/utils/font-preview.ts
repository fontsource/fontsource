import { generateCSS, selectVariableAxisKey } from '@fontsource-utils/core';

import type {
	GetFontResponse,
	GetVariableFontResponse,
} from '../generated/api';
import { jsDelivrResolver } from './cdn';
import {
	isDigitalFontFamily,
	isPunctuationFontFamily,
	type RegistryFamily,
} from './registry';

type FontPreviewIdentity = Pick<GetFontResponse, 'family' | 'id' | 'variable'>;

const latinPreviewSubsets = new Set([
	'all',
	'latin',
	'latin-ext',
	'vietnamese',
]);
const rtlPreviewSubsets = new Set([
	'adlam',
	'arabic',
	'hebrew',
	'mandaic',
	'nko',
	'samaritan',
	'syriac',
	'thaana',
]);

const subsetAliases: Array<{ idSuffix: string; subset: string }> = [
	{ idSuffix: '-hk', subset: 'chinese-hongkong' },
	{ idSuffix: '-jp', subset: 'japanese' },
	{ idSuffix: '-kr', subset: 'korean' },
	{ idSuffix: '-sc', subset: 'chinese-simplified' },
	{ idSuffix: '-tc', subset: 'chinese-traditional' },
];

const fontPreviewSubsets: Record<string, string> = {
	'noto-sans-math': 'math',
	'noto-sans-symbols': 'symbols',
	'noto-sans-symbols-2': 'symbols',
};

export const isLatinPreviewSubset = (subset: string) =>
	latinPreviewSubsets.has(subset);

export const getPreviewDirection = (subset: string): 'ltr' | 'rtl' =>
	rtlPreviewSubsets.has(subset) ? 'rtl' : 'ltr';

export const getPreferredPreviewSubset = (metadata: GetFontResponse) => {
	const fontPreviewSubset = fontPreviewSubsets[metadata.id];
	if (fontPreviewSubset) return fontPreviewSubset;

	const aliasedSubset = subsetAliases.find(
		({ idSuffix, subset }) =>
			metadata.id.endsWith(idSuffix) && metadata.subsets.includes(subset),
	)?.subset;
	if (aliasedSubset) return aliasedSubset;

	const idMatchedSubset = metadata.subsets
		.filter((subset) => !latinPreviewSubsets.has(subset) && subset !== 'menu')
		.sort((a, b) => b.length - a.length)
		.find((subset) => metadata.id.includes(subset));

	return idMatchedSubset ?? metadata.defSubset;
};

export const getFontFamilyStack = (
	metadata: FontPreviewIdentity,
	variableAvailable = metadata.variable,
	registry?: RegistryFamily,
) => {
	const family = variableAvailable
		? `${metadata.family} Variable`
		: metadata.family;

	if (isPunctuationFontFamily(registry)) {
		return `"${family}", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif`;
	}

	if (isDigitalFontFamily(registry)) {
		return `"${family}", ui-monospace, monospace`;
	}

	return `"${family}", "Fallback Outline"`;
};

export const getFontPreviewCSS = (
	metadata: GetFontResponse,
	variable?: GetVariableFontResponse,
) => {
	const unicodeKeys = Object.keys(metadata.unicodeRange).map((key) =>
		key.replace('[', '').replace(']', ''),
	);
	const subsets = unicodeKeys.length > 0 ? unicodeKeys : metadata.subsets;
	const cssConfig = {
		id: metadata.id,
		family: metadata.family,
		subsets,
		weights: metadata.weights,
		styles: metadata.styles,
		unicodeRange: metadata.unicodeRange,
	};
	const staticCSS = generateCSS(cssConfig, {
		resolver: jsDelivrResolver(metadata.id),
		display: 'swap',
	});
	const variableCSS = variable
		? generateCSS(
				{ ...cssConfig, variable: variable.axes },
				{
					axisKeys: [
						selectVariableAxisKey(variable.axes, Object.keys(variable.axes)),
					],
					resolver: jsDelivrResolver(metadata.id, true),
					display: 'swap',
				},
			)
		: undefined;

	return { staticCSS, variableCSS };
};
