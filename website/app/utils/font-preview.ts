import {
	generateCSS,
	renderFontFaceRule,
	resolveFontFaces,
	selectVariableAxisKey,
} from '@fontsource-utils/core/css';

import type {
	GetFontResponse,
	GetVariableFontResponse,
} from '../generated/api';
import { jsDelivrResolver } from './cdn';
import type { RegistryFamily, RegistrySource } from './registry';

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
	const weight =
		typeof source.weight === 'number'
			? (source.declaredVariant?.weight ?? source.weight)
			: `${source.weight.min} ${source.weight.max}`;
	try {
		return renderFontFaceRule({
			family: fontFamily,
			style: source.declaredVariant?.style ?? source.style,
			weight,
			unicodeRange: null,
			sources: files.map(({ url, format }) => ({
				url: new URL(url, 'https://api.fontsource.org').toString(),
				format,
			})),
		});
	} catch {
		return '';
	}
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
	const faces = resolveFontFaces(
		{
			id: metadata.id,
			family: metadata.family,
			subsets,
			weights: metadata.weights,
			styles: metadata.styles,
			unicodeRange,
			variable: variable?.axes,
		},
		variable
			? [selectVariableAxisKey(variable.axes, Object.keys(variable.axes))]
			: undefined,
	);
	return generateCSS(metadata.family, faces, {
		resolver: jsDelivrResolver(metadata.id, !!variable),
	});
};
