import {
	generateCSS,
	selectVariableAxisKey,
	type UrlResolver,
} from '@fontsource-utils/core';

import type {
	GetFontResponse,
	GetRegistrySubsetResponse,
	GetVariableFontResponse,
} from '@/generated/api';
import { jsDelivrResolver } from '../../utils/cdn';

type FontDisplay = 'auto' | 'swap' | 'block' | 'fallback' | 'optional';
type WebFontFormat = 'woff2' | 'woff';

const fallbackFamilies: Record<GetFontResponse['category'], string> = {
	'sans-serif': 'sans-serif',
	serif: 'serif',
	display: 'serif',
	handwriting: 'cursive',
	monospace: 'monospace',
	icons: 'sans-serif',
	other: 'sans-serif',
};

interface FamilyUseCSSOptions {
	metadata: GetFontResponse;
	variable?: GetVariableFontResponse;
	isVariable: boolean;
	styles: GetFontResponse['styles'];
	weights: number[];
	subsets: string[];
	activeAxes: string[];
	formats: WebFontFormat[];
	display: FontDisplay;
	version: string;
	delivery: 'package' | 'cdn';
	subsetDefinitions?: GetRegistrySubsetResponse[];
}

const fontDisplays: FontDisplay[] = [
	'swap',
	'fallback',
	'optional',
	'block',
	'auto',
];

const webFontFormats: WebFontFormat[] = ['woff2', 'woff'];

const packageResolver =
	(packageName: string): UrlResolver =>
	({ source }) =>
		`${packageName}/files/${source.filename}`;

const buildFamilyUseCSS = ({
	metadata,
	variable,
	isVariable,
	styles,
	weights,
	subsets,
	activeAxes,
	formats,
	display,
	version,
	delivery,
	subsetDefinitions = [],
}: FamilyUseCSSOptions) => {
	const packageName = isVariable
		? `@fontsource-variable/${metadata.id}`
		: `@fontsource/${metadata.id}`;
	const resolver =
		delivery === 'package'
			? packageResolver(packageName)
			: jsDelivrResolver(metadata.id, isVariable, version);
	const subsetSlices = Object.fromEntries(
		subsetDefinitions.flatMap((definition) => {
			if (!definition.slices?.length) return [];
			return [
				[
					definition.id,
					definition.slices.map((slice) => ({
						id: Number(slice.id),
						unicodeRange: slice.ranges
							.map(([start, end]) =>
								start === end ? `U+${start}` : `U+${start}-${end}`,
							)
							.join(', '),
					})),
				],
			];
		}),
	);

	return generateCSS(
		{
			id: metadata.id,
			family: metadata.family,
			subsets,
			weights,
			styles,
			unicodeRange: metadata.unicodeRange,
			subsetSlices,
			formats: isVariable ? ['woff2'] : formats,
			...(isVariable && variable ? { variable: variable.axes } : {}),
		},
		{
			display,
			resolver,
			...(isVariable && variable
				? { axisKeys: [selectVariableAxisKey(variable.axes, activeAxes)] }
				: {}),
		},
	);
};

const buildFamilyUsageCSS = (
	metadata: GetFontResponse,
	isVariable: boolean,
	weight: number,
	style: GetFontResponse['styles'][number],
) => {
	const family =
		`${metadata.family}${isVariable ? ' Variable' : ''}`.replaceAll("'", "\\'");

	return `body {\n  font-family: '${family}', ${fallbackFamilies[metadata.category]};\n  font-weight: ${weight};\n  font-style: ${style};\n}`;
};

export {
	buildFamilyUsageCSS,
	buildFamilyUseCSS,
	type FontDisplay,
	fontDisplays,
	type WebFontFormat,
	webFontFormats,
};
