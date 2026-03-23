import {
	generateCSS,
	selectVariableAxisKey,
	type UrlResolver,
} from '@fontsource-utils/core';
import type { Metadata, VariableData } from '@/utils/types';

interface StaticStyleSheetOptions {
	subsets: string[];
	weights: number[];
	style: 'normal' | 'italic';
	formats: ('woff2' | 'woff' | 'ttf')[];
	display: string;
	resolver: UrlResolver;
}

interface VariableStyleSheetOptions {
	activeAxes: string[];
	subsets: string[];
	style: 'normal' | 'italic';
	display: string;
	resolver: UrlResolver;
}

export const buildStaticPreviewCSS = (
	metadata: Metadata,
	options: StaticStyleSheetOptions,
): string =>
	generateCSS(
		{
			id: metadata.id,
			family: metadata.family,
			subsets: options.subsets,
			weights: options.weights,
			styles: [options.style],
			unicodeRange: metadata.unicodeRange,
			formats: options.formats,
		},
		{
			display: options.display,
			resolver: options.resolver,
		},
	);

export const buildVariablePreviewCSS = (
	metadata: Metadata,
	variable: VariableData,
	options: VariableStyleSheetOptions,
): string => {
	const axisKey = selectVariableAxisKey(variable.axes, options.activeAxes);

	return generateCSS(
		{
			id: metadata.id,
			family: metadata.family,
			subsets: options.subsets,
			weights: metadata.weights,
			styles: [options.style],
			unicodeRange: metadata.unicodeRange,
			formats: ['woff2'],
			variable: variable.axes,
		},
		{
			axisKeys: [axisKey],
			display: options.display,
			resolver: options.resolver,
		},
	);
};

export const getVariableImport = (
	metadata: Metadata,
	variable: VariableData,
	activeAxes: string[],
	style: 'normal' | 'italic',
): string => {
	const axisKey = selectVariableAxisKey(
		variable.axes,
		activeAxes,
	).toLowerCase();

	return `@fontsource-variable/${metadata.id}/${style === 'italic' ? `${axisKey}-italic.css` : `${axisKey}.css`}`;
};
