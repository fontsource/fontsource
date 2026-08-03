import { generateCSS, selectVariableAxisKey } from '@fontsource-utils/core';

import type {
	GetFontResponse,
	GetVariableFontResponse,
} from '../generated/api';
import { jsDelivrResolver } from './cdn';
import {
	getRegistryFamilyKind,
	getRegistrySourcePreviewStyle,
	type RegistryFamily,
	type RegistrySource,
} from './registry';

type FontPreviewIdentity = Pick<GetFontResponse, 'family' | 'id' | 'variable'>;

type PreviewLanguage = {
	language: string;
	script: string;
};

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

export const registrySourcePreviewFamily = 'Fontsource Registry Preview';

export const isLatinPreviewSubset = (subset: string) =>
	latinPreviewSubsets.has(subset);

export const getPreviewDirection = (subset: string): 'ltr' | 'rtl' =>
	rtlPreviewSubsets.has(subset) ? 'rtl' : 'ltr';

export const getPreviewLanguageTag = (language?: PreviewLanguage) =>
	language ? `${language.language}-${language.script}` : undefined;

export const getFontPreviewFamily = (
	metadata: FontPreviewIdentity,
	variableAvailable = metadata.variable,
) => (variableAvailable ? `${metadata.family} Variable` : metadata.family);

export const getRegistrySourcePreviewCSS = (
	source: RegistrySource,
	fontFamily = registrySourcePreviewFamily,
) => {
	const format = source.format === 'ttf' ? 'truetype' : 'opentype';
	const { fontStyle, fontWeight } = getRegistrySourcePreviewStyle(source);
	const weight =
		source.type === 'variable' && typeof source.weight !== 'number'
			? `${source.weight.min} ${source.weight.max}`
			: fontWeight;
	const sourceUrl = new URL(
		source.downloadUrl,
		'https://api.fontsource.org',
	).toString();

	return `@font-face {
	font-family: ${JSON.stringify(fontFamily)};
	src: url(${JSON.stringify(sourceUrl)}) format("${format}");
	font-style: ${fontStyle};
	font-weight: ${weight};
	font-display: swap;
}`;
};

export const selectRegistryPreviewSource = (
	registry: RegistryFamily | undefined,
	options: {
		variableAvailable: boolean;
		style: 'normal' | 'italic';
		weight: number;
	},
) => {
	if (!registry) return;

	const sourceByHash = new Map(
		registry.sources.map((source) => [source.sha256, source]),
	);
	if (options.variableAvailable) {
		const variableEntries = registry.distribution.variable?.filter(
			(entry) => entry.style === options.style,
		);
		const variableEntry =
			variableEntries?.find((entry) => entry.axisKey === 'standard') ??
			variableEntries?.[0];
		if (variableEntry) return sourceByHash.get(variableEntry.source);
	}

	const staticEntries = registry.distribution.static?.filter(
		(entry) => entry.style === options.style,
	);
	const staticEntry = staticEntries?.length
		? staticEntries.reduce((closest, entry) =>
				Math.abs(entry.weight - options.weight) <
				Math.abs(closest.weight - options.weight)
					? entry
					: closest,
			)
		: undefined;
	if (staticEntry) return sourceByHash.get(staticEntry.source);

	return sourceByHash.get(registry.previewSource);
};

export const getPreferredPreviewSubset = (
	metadata: GetFontResponse,
	registry?: RegistryFamily,
) =>
	registry?.previewSubset && metadata.subsets.includes(registry.previewSubset)
		? registry.previewSubset
		: metadata.defSubset;

export const getFontFamilyStack = (
	metadata: FontPreviewIdentity,
	variableAvailable = metadata.variable,
	registry?: RegistryFamily,
) => {
	const family = getFontPreviewFamily(metadata, variableAvailable);

	const familyKind = getRegistryFamilyKind(registry);
	if (familyKind === 'punctuation') {
		return `"${family}", "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif`;
	}

	if (familyKind === 'digital') {
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
