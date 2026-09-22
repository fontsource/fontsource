import { generateCSS, selectVariableAxisKey } from '@fontsource-utils/core';

import type {
	GetFontResponse,
	GetVariableFontResponse,
} from '../generated/api';
import { jsDelivrResolver } from './cdn';
import {
	getRegistrySourcePreviewStyle,
	type RegistryFamily,
	type RegistrySource,
} from './registry';

type FontPreviewIdentity = Pick<GetFontResponse, 'family' | 'id' | 'variable'>;

type PreviewLanguage = {
	language: string;
	script: string;
};

export const registrySourcePreviewFamily = 'Fontsource Registry Preview';

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
	const files = [
		{
			url: source.downloadUrl,
			format: source.format === 'ttf' ? 'truetype' : 'opentype',
		},
	];
	// API, snapshot, and website releases can overlap during the backfill.
	if (source.previewUrl)
		files.unshift({ url: source.previewUrl, format: 'woff2' });
	const { fontStyle, fontWeight } = getRegistrySourcePreviewStyle(source);
	const weight =
		source.type === 'variable' && typeof source.weight !== 'number'
			? `${source.weight.min} ${source.weight.max}`
			: fontWeight;
	let sources: string;
	try {
		sources = files
			.map(
				({ url, format }) =>
					`url(${JSON.stringify(new URL(url, 'https://api.fontsource.org').toString())}) format("${format}")`,
			)
			.join(', ');
	} catch {
		return '';
	}

	return `@font-face {
	font-family: ${JSON.stringify(fontFamily)};
	src: ${sources};
	font-style: ${fontStyle};
	font-weight: ${weight};
	font-display: swap;
}`;
};

export const selectRegistryPreviewSource = (
	registry: RegistryFamily,
	options: {
		variableAvailable: boolean;
		style: 'normal' | 'italic';
		weight: number;
	},
) => {
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

export const getFontFamilyStack = (
	metadata: FontPreviewIdentity,
	variableAvailable = metadata.variable,
	registry: Pick<RegistryFamily, 'previewContext'>,
) => {
	const family = getFontPreviewFamily(metadata, variableAvailable);
	const genericFamilies = new Set([
		'sans-serif',
		'serif',
		'monospace',
		'cursive',
		'fantasy',
		'system-ui',
		'ui-sans-serif',
		'ui-serif',
		'ui-monospace',
		'ui-rounded',
	]);
	const fallbacks = registry.previewContext?.fallbackFamilies ?? [
		'Fallback Outline',
	];
	const quotedFallbacks = fallbacks.map((fallback) =>
		genericFamilies.has(fallback) ? fallback : `"${fallback}"`,
	);
	return [`"${family}"`, ...quotedFallbacks].join(', ');
};
export const getFontPreviewCSS = (
	metadata: Omit<GetFontResponse, 'variants'>,
	variable?: GetVariableFontResponse,
) => {
	const unicodeRange = Object.fromEntries(
		Object.entries(metadata.unicodeRange).map(([key, range]) => [
			key.replace('[', '').replace(']', ''),
			range,
		]),
	);
	const unicodeKeys = Object.keys(unicodeRange);
	const subsets = unicodeKeys.length > 0 ? unicodeKeys : metadata.subsets;
	const cssConfig = {
		id: metadata.id,
		family: metadata.family,
		subsets,
		weights: metadata.weights,
		styles: metadata.styles,
		unicodeRange,
	};
	return variable
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
		: generateCSS(cssConfig, {
				resolver: jsDelivrResolver(metadata.id),
				display: 'swap',
			});
};
