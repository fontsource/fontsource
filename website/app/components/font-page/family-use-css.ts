import {
	generateCSS,
	resolveFontFaces,
	selectVariableAxisKey,
	type UrlResolver,
} from '@fontsource-utils/core/css';
import type { GetFontResponse } from '@/generated/api';
import type { FontPackage, FontPageMetadata } from '@/utils/font-package';
import { jsDelivrResolver } from '../../utils/cdn';

type FontDisplay = 'auto' | 'swap' | 'block' | 'fallback' | 'optional';

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
	fontPackage: FontPackage;
	isVariable: boolean;
	styles: FontPageMetadata['styles'];
	weights: number[];
	activeAxes: string[];
	display: FontDisplay;
	delivery: 'package' | 'cdn';
}

const fontDisplays: FontDisplay[] = [
	'swap',
	'fallback',
	'optional',
	'block',
	'auto',
];

const packageResolver =
	(packageName: string): UrlResolver =>
	({ source }) =>
		`${packageName}/files/${source.filename}`;

const buildFamilyUseCSS = ({
	fontPackage,
	isVariable,
	styles,
	weights,
	activeAxes,
	display,
	delivery,
}: FamilyUseCSSOptions) => {
	const { metadata, variable } = fontPackage;
	const packageName = isVariable
		? `@fontsource-variable/${metadata.id}`
		: `@fontsource/${metadata.id}`;
	const resolver =
		delivery === 'package'
			? packageResolver(packageName)
			: jsDelivrResolver(metadata.id, isVariable, fontPackage.version);
	if (fontPackage.manifest) {
		const manifest = fontPackage.manifest;
		const axisKey = activeAxes[0];
		const entrypoints = styles.flatMap((style) =>
			(isVariable ? [axisKey] : weights).map(
				(key) => `${key}${style === 'normal' ? '' : '-italic'}.css`,
			),
		);
		const indices = new Set(
			entrypoints.flatMap((filename) => manifest.entrypoints[filename] ?? []),
		);
		const faces = Array.from(indices, (index) => manifest.faces[index]);
		return generateCSS(manifest.family, faces, { display, resolver });
	}
	const legacy = fontPackage.legacy;
	const subsetDefinitions = fontPackage.subsetDefinitions ?? [];
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

	const faces = resolveFontFaces(
		{
			id: metadata.id,
			family: metadata.family,
			subsets: legacy.subsets,
			weights,
			styles,
			unicodeRange: legacy.unicodeRange,
			subsetSlices,
			formats: ['woff2'],
			variable: isVariable ? variable?.axes : undefined,
		},
		isVariable && variable
			? [selectVariableAxisKey(variable.axes, activeAxes)]
			: undefined,
	);
	return generateCSS(metadata.family, faces, { display, resolver });
};

const buildFamilyUsageCSS = (
	metadata: FontPageMetadata,
	isVariable: boolean,
	weight: number,
	style: FontPageMetadata['styles'][number],
) => {
	const family =
		`${metadata.family}${isVariable ? ' Variable' : ''}`.replaceAll("'", "\\'");

	return `body {\n  font-family: '${family}', ${fallbackFamilies[metadata.category]};\n  font-weight: ${weight};\n  font-style: ${style.split(' ').slice(0, 2).join(' ')};\n}`;
};

export {
	buildFamilyUsageCSS,
	buildFamilyUseCSS,
	type FontDisplay,
	fontDisplays,
};
