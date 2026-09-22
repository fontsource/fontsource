import {
	determineAxisKey,
	type FontStyle,
	formatAxisValue,
	getFaceStretch,
	getFaceStyle,
	renderFontFaceRule,
} from '@fontsource-utils/core/css';
import type {
	FontObjectV1,
	FontObjectV2,
	FontObjectVariable,
} from 'google-font-metadata';
import type { CSSGenerate } from '../types';
import { findClosest } from '../utils';

type GenerateMetadataV1 = Pick<
	FontObjectV1['id'],
	'id' | 'family' | 'styles' | 'weights' | 'subsets' | 'variants'
> & { unicodeRange?: Record<string, string> };

type GenerateMetadataV2 = Pick<
	FontObjectV2['id'],
	| 'id'
	| 'family'
	| 'styles'
	| 'weights'
	| 'subsets'
	| 'variants'
	| 'unicodeRange'
>;

type GenerateMetadataVariable = Pick<
	FontObjectVariable['id'],
	'axes' | 'variants'
>;

type GenerateIconStatic = Pick<
	FontObjectV2['id'],
	'id' | 'family' | 'styles' | 'weights' | 'subsets' | 'variants'
>;

type GenerateIconVariable = Pick<
	FontObjectVariable['id'],
	'id' | 'family' | 'axes' | 'variants'
>;

type StaticPath = (
	id: string,
	subset: string,
	weight: string,
	style: string,
	extension: string,
) => string;
type VariablePath = (
	id: string,
	subset: string,
	axes: string,
	style: string,
) => string;

// Match the files selected by the downloader, including absent format fallbacks.
const available = (url: string | undefined) => /^https?:\/\//.test(url ?? '');

const staticFaces = (
	metadata: GenerateMetadataV1,
	makePath: StaticPath,
	tag?: string,
	ranges?: Record<string, string>,
) =>
	Object.entries(metadata.variants).flatMap(([weight, styles]) =>
		Object.entries(styles).flatMap(([style, subsets]) =>
			Object.entries(subsets).flatMap(([subset, { url }]) => {
				const sources = (['woff2', 'woff'] as const)
					.filter((format) => available(url[format]))
					.map((format) => ({
						url: makePath(
							tag ?? metadata.id,
							subset.replace('[', '').replace(']', ''),
							weight,
							style,
							format,
						),
						format,
					}));
				if (!sources.length) return [];
				return [
					{
						subset,
						weight: Number(weight),
						style,
						css: renderFontFaceRule({
							family: metadata.family,
							style,
							weight,
							sources,
							unicodeRange: ranges?.[subset] ?? null,
						}),
					},
				];
			}),
		),
	);

const append = (
	assets: Map<string, string[]>,
	filename: string,
	css: string,
) => {
	const blocks = assets.get(filename) ?? [];
	blocks.push(css);
	assets.set(filename, blocks);
};
const finish = (assets: Map<string, string[]>): CSSGenerate =>
	Array.from(assets, ([filename, blocks]) => ({
		filename,
		css: blocks.join('\n\n'),
	}));
const styleSuffix = (style: string) => (style === 'normal' ? '' : `-${style}`);

export const generateV1CSS = (
	metadata: GenerateMetadataV1,
	makePath: StaticPath,
	tag?: string,
): CSSGenerate => {
	const assets = new Map<string, string[]>();
	for (const { subset, weight, style, css } of staticFaces(
		metadata,
		makePath,
		tag,
		metadata.unicodeRange,
	)) {
		const suffix = styleSuffix(style);
		append(assets, `${subset}-${weight}${suffix}.css`, css);
		append(assets, `${subset}${suffix}.css`, css);
	}
	// Retain published base subset imports for italic-only families.
	for (const subset of metadata.subsets) {
		if (!assets.has(`${subset}.css`)) assets.set(`${subset}.css`, []);
	}
	return finish(assets);
};

export const generateV2CSS = (
	metadata: GenerateMetadataV2,
	makePath: StaticPath,
	tag?: string,
): CSSGenerate => {
	const faces = staticFaces(metadata, makePath, tag, metadata.unicodeRange);
	const assets = new Map<string, string[]>();
	const defaultStyle = faces.some((face) => face.style === 'normal')
		? 'normal'
		: faces[0]?.style;
	const defaultWeight = findClosest(
		faces
			.filter((face) => face.style === defaultStyle)
			.map((face) => face.weight),
		400,
	);
	for (const { weight, style, css } of faces) {
		append(assets, `${weight}${styleSuffix(style)}.css`, css);
		if (weight === defaultWeight && style === defaultStyle)
			append(assets, 'index.css', css);
	}
	return finish(assets);
};

export const generateIconStaticCSS = (
	metadata: GenerateIconStatic,
	makePath: StaticPath,
	tag?: string,
): CSSGenerate => {
	const faces = staticFaces(metadata, makePath, tag);
	const assets = new Map<string, string[]>();
	const defaultStyle = faces.some((face) => face.style === 'normal')
		? 'normal'
		: faces[0]?.style;
	const defaultWeight = findClosest(
		faces
			.filter((face) => face.style === defaultStyle)
			.map((face) => face.weight),
		400,
	);
	for (const { subset, weight, style, css } of faces) {
		const suffix = styleSuffix(style);
		append(assets, `${weight}${suffix}.css`, css);
		append(assets, `${subset}-${weight}${suffix}.css`, css);
		append(assets, `${subset}.css`, css);
		if (weight === defaultWeight && style === defaultStyle)
			append(assets, 'index.css', css);
	}
	return finish(assets);
};

const variableCSS = (
	id: string,
	family: string,
	{ axes, variants }: GenerateMetadataVariable,
	weight: number,
	ranges: Record<string, string> | null,
	makePath: VariablePath,
): CSSGenerate => {
	const assets = new Map<string, string[]>();
	for (const [axisKey, styles] of Object.entries(variants)) {
		for (const [style, subsets] of Object.entries(styles)) {
			for (const [subset, url] of Object.entries(subsets)) {
				if (!available(url)) continue;
				append(
					assets,
					`${axisKey.toLowerCase()}${styleSuffix(style)}.css`,
					renderFontFaceRule({
						family,
						isVariable: true,
						style: getFaceStyle(axisKey, style as FontStyle, axes),
						stretch: getFaceStretch(axisKey, axes),
						weight: axes.wght ? formatAxisValue(axes.wght) : weight,
						unicodeRange: ranges?.[subset] ?? null,
						sources: [
							{
								url: makePath(
									id,
									subset.replace('[', '').replace(']', ''),
									axisKey.toLowerCase(),
									style,
								),
								format: 'woff2-variations',
							},
						],
					}),
				);
			}
		}
	}
	const css = finish(assets);
	// Prefer existing entrypoints; metadata cannot select a bundle that was not emitted.
	const preferred = ['wght', 'opsz', determineAxisKey(axes).toLowerCase()];
	const index =
		preferred
			.map(
				(axis) =>
					css.find((entry) => entry.filename === `${axis}.css`) ??
					css.find((entry) => entry.filename.startsWith(`${axis}-`)),
			)
			.find((entry) => entry !== undefined) ?? css[0];
	if (!index) throw new Error(`Unable to generate index.css for ${id}`);
	return [...css, { filename: 'index.css', css: index.css }];
};

export const generateVariableCSS = (
	metadata: GenerateMetadataV2,
	variableMeta: GenerateMetadataVariable,
	makePath: VariablePath,
	tag?: string,
): CSSGenerate =>
	variableCSS(
		tag ?? metadata.id,
		metadata.family,
		variableMeta,
		findClosest(metadata.weights, 400),
		metadata.unicodeRange,
		makePath,
	);

export const generateIconVariableCSS = (
	metadata: GenerateIconVariable,
	makePath: VariablePath,
	tag?: string,
): CSSGenerate =>
	variableCSS(
		tag ?? metadata.id,
		metadata.family,
		metadata,
		Number(metadata.axes.wght?.default ?? 400),
		null,
		makePath,
	);
