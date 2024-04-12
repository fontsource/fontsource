import { type FontObject, generateFontFace } from '@fontsource-utils/generate';
import {
	type APIIconResponse,
	type FontObjectV1,
	type FontObjectV2,
	type FontObjectVariable,
} from 'google-font-metadata';

import type { CSSGenerate } from '../types';
import { findClosest } from '../utils';

/**
 * We need to generate all CSS in this one file to ensure that pkgroll
 * exports these functions without accidentally importing unnecessary
 * node modules. Unfortunately mixing other functions leads to node
 * imports breaking builds that don't run in Node environments.
 */

type GenerateMetadataV1 = Pick<
	FontObjectV1['id'],
	'id' | 'family' | 'styles' | 'weights' | 'subsets' | 'variants'
>;

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

export const generateV1CSS = (
	metadata: GenerateMetadataV1,
	makeFontFilePath: (
		id: string,
		subset: string,
		weight: string,
		style: string,
		extension: string,
	) => string,
	tag?: string,
): CSSGenerate => {
	const cssGenerate: CSSGenerate = [];
	const { id, family, styles, weights, subsets, variants } = metadata;

	for (const subset of subsets) {
		// Arrays of CSS blocks to be concatenated
		const cssSubset: string[] = [];
		const cssSubsetItalic: string[] = [];

		for (const weight of weights) {
			for (const style of styles) {
				// Some fonts may have variants 400, 400i, 700 but not 700i
				if (style in variants[weight]) {
					const fontObj = {
						family,
						style,
						display: 'swap',
						weight,
						src: [
							{
								url: makeFontFilePath(
									tag ?? id,
									subset,
									String(weight),
									style,
									'woff2',
								),
								format: 'woff2' as const,
							},
							{
								url: makeFontFilePath(
									tag ?? id,
									subset,
									String(weight),
									style,
									'woff',
								),
								format: 'woff' as const,
							},
						],
						comment: `${tag ?? id}-${subset}-${weight}-${style}`,
					};
					// This takes in a font object and returns an @font-face block
					const css = generateFontFace(fontObj);

					// Needed to differentiate filenames
					if (style === 'normal') {
						cssGenerate.push({
							filename: `${subset}-${weight}.css`,
							css,
						});

						cssSubset.push(css);
					} else {
						cssGenerate.push({
							filename: `${subset}-${weight}-${style}.css`,
							css,
						});

						cssSubsetItalic.push(css);
					}
				}
			}
		}

		cssGenerate.push({
			filename: `${subset}.css`,
			css: cssSubset.join('\n\n'),
		});

		// If there are italic styles for a subset
		if (cssSubsetItalic.length > 0) {
			cssGenerate.push({
				filename: `${subset}-italic.css`,
				css: cssSubsetItalic.join('\n\n'),
			});
		}
	}

	return cssGenerate;
};

export const generateV2CSS = (
	metadata: GenerateMetadataV2,
	makeFontFilePath: (
		id: string,
		subset: string,
		weight: string,
		style: string,
		extension: string,
	) => string,
	tag?: string,
): CSSGenerate => {
	const cssGenerate: CSSGenerate = [];
	const { id, family, styles, weights, variants, unicodeRange, subsets } =
		metadata;

	// Find the weight for index.css in the case weight 400 does not exist.
	const indexWeight = findClosest(weights, 400);

	// Generate CSS
	const hasUnicode = Object.keys(unicodeRange).length > 0;
	const unicodeKeys = hasUnicode ? Object.keys(unicodeRange) : subsets;

	for (const weight of weights) {
		for (const style of styles) {
			const cssStyle: string[] = [];

			for (const subset of unicodeKeys) {
				// Some fonts may have variants 400, 400i, 700 but not 700i.
				if (style in variants[weight]) {
					const fontObj = {
						family,
						style,
						display: 'swap',
						weight,
						unicodeRange: hasUnicode ? unicodeRange[subset] : undefined,
						src: [
							{
								url: makeFontFilePath(
									tag ?? id,
									subset,
									String(weight),
									style,
									'woff2',
								),
								format: 'woff2' as const,
							},
							{
								url: makeFontFilePath(
									tag ?? id,
									subset,
									String(weight),
									style,
									'woff',
								),
								format: 'woff' as const,
							},
						],
						comment: `${tag ?? id}-${subset}-${weight}-${style}`,
					};
					// This takes in a font object and returns an @font-face block
					const css = generateFontFace(fontObj);
					cssStyle.push(css);
				}
			}

			// Write down CSS
			if (style in variants[weight]) {
				if (style === 'normal') {
					cssGenerate.push({
						filename: `${weight}.css`,
						css: cssStyle.join('\n\n'),
					});

					// Generate index CSS
					if (weight === indexWeight) {
						cssGenerate.push({
							filename: 'index.css',
							css: cssStyle.join('\n\n'),
						});
					}
				} else {
					// If italic or else, define specific style CSS file
					cssGenerate.push({
						filename: `${weight}-${style}.css`,
						css: cssStyle.join('\n\n'),
					});
				}
			}
		}
	}

	return cssGenerate;
};

export const generateVariableCSS = (
	metadata: GenerateMetadataV2,
	variableMeta: GenerateMetadataVariable,
	makeFontFilePath: (
		id: string,
		subset: string,
		axes: string,
		style: string,
	) => string,
	tag?: string,
): CSSGenerate => {
	const { id, family, unicodeRange, weights } = metadata;
	const { axes, variants } = variableMeta;
	const cssGenerate: CSSGenerate = [];
	let indexCSS = '';

	for (const axesKey of Object.keys(variants)) {
		const variant = variants[axesKey];
		const styles = Object.keys(variant);
		const axesLower = axesKey.toLowerCase();

		// These are variable modifiers to change specific CSS selectors
		// for variable fonts.
		const variableOpts: FontObject['variable'] = {
			wght: axes.wght,
		};
		if (axesKey === 'standard' || axesKey === 'full' || axesKey === 'wdth')
			variableOpts.stretch = axes.wdth;

		if (axesKey === 'standard' || axesKey === 'full' || axesKey === 'slnt')
			variableOpts.slnt = axes.slnt;

		for (const style of styles) {
			const cssStyle: string[] = [];

			for (const subset of Object.keys(variant[style])) {
				const fontObj: FontObject = {
					family: `${family} Variable`,
					style,
					display: 'swap',
					weight: findClosest(weights, 400),
					unicodeRange: unicodeRange[subset],
					variable: variableOpts,
					src: [
						{
							url: makeFontFilePath(tag ?? id, subset, axesLower, style),
							format: 'woff2-variations',
						},
					],
					comment: `${tag ?? id}-${subset}-${axesLower}-${style}`,
				};

				// This takes in a font object and returns an @font-face block
				const css = generateFontFace(fontObj);
				cssStyle.push(css);
			}

			// Write down CSS
			const filename =
				style === 'normal' ? `${axesLower}.css` : `${axesLower}-${style}.css`;
			const css = cssStyle.join('\n\n');

			cssGenerate.push({
				filename,
				css,
			});

			// Ensure style is normal or there is only one style
			if (axesKey === 'wght' && (style === 'normal' || styles.length === 1))
				indexCSS = css;

			// Some fonts may not have a wght axis, but usually have an opsz axis to compensate
			if (indexCSS === '' && axesKey === 'opsz') indexCSS = css;
		}
	}

	// Write down index.css for variable package
	cssGenerate.push({
		filename: 'index.css',
		css: indexCSS,
	});

	return cssGenerate;
};

export const generateIconStaticCSS = (
	metadata: GenerateIconStatic,
	makeFontFilePath: (
		id: string,
		subset: string,
		weight: string,
		style: string,
		extension: string,
	) => string,
	tag?: string,
): CSSGenerate => {
	const cssGenerate: CSSGenerate = [];
	const { id, family, styles, weights, subsets, variants } = metadata;

	// Find the weight for index.css in the case weight 400 does not exist.
	const indexWeight = findClosest(weights, 400);

	// Generate CSS
	for (const subset of subsets) {
		// Arrays of CSS blocks to be concatenated
		const cssSubset: string[] = [];

		for (const weight of weights) {
			for (const style of styles) {
				// Some fonts may have variants 400, 400i, 700 but not 700i
				if (style in variants[weight]) {
					const fontObj = {
						family,
						style,
						display: 'swap',
						weight,
						src: [
							{
								url: makeFontFilePath(
									tag ?? id,
									subset,
									String(weight),
									style,
									'woff2',
								),
								format: 'woff2' as const,
							},
							{
								url: makeFontFilePath(
									tag ?? id,
									subset,
									String(weight),
									style,
									'woff',
								),
								format: 'woff' as const,
							},
						],
						comment: `${tag ?? id}-${subset}-${weight}-${style}`,
					};
					// This takes in a font object and returns an @font-face block
					const css = generateFontFace(fontObj);

					if (style === 'normal') {
						cssGenerate.push(
							{
								filename: `${weight}.css`,
								css,
							},
							{
								filename: `${subset}-${weight}.css`,
								css,
							},
						);
					} else {
						cssGenerate.push(
							{
								filename: `${weight}-italic.css`,
								css,
							},
							{
								filename: `${subset}-${weight}-italic.css`,
								css,
							},
						);
					}
					cssSubset.push(css);
				}
			}

			// If the weight is index, generate index.css
			if (weight === indexWeight) {
				cssGenerate.push({
					filename: 'index.css',
					css: cssSubset.join('\n\n'),
				});
			}

			cssGenerate.push({
				filename: `${subset}.css`,
				css: cssSubset.join('\n\n'),
			});
		}
	}

	return cssGenerate;
};

export const generateIconVariableCSS = (
	metadata: GenerateIconVariable,
	makeFontFilePath: (
		id: string,
		subset: string,
		axesLower: string,
		style: string,
	) => string,
	tag?: string,
): CSSGenerate => {
	const cssGenerate: CSSGenerate = [];
	const { id, family, variants, axes } = metadata;

	// Generate CSS
	let indexCSS = '';

	for (const axesKey of Object.keys(variants)) {
		const variant = variants[axesKey];
		const styles = Object.keys(variant);
		const axesLower = axesKey.toLowerCase();

		// These are variable modifiers to change specific CSS selectors
		// for variable fonts.
		const variableOpts: APIIconResponse['axes'] = {
			wght: axes.wght,
		};
		if (axesKey === 'standard' || axesKey === 'full' || axesKey === 'wdth')
			variableOpts.stretch = axes.wdth;

		if (axesKey === 'standard' || axesKey === 'full' || axesKey === 'slnt')
			variableOpts.slnt = axes.slnt;

		// Generate variable CSS
		for (const style of styles) {
			const cssStyle: string[] = [];

			for (const subset of Object.keys(variant[style])) {
				const fontObj: FontObject = {
					family: `${family} Variable`,
					style,
					display: 'swap',
					weight: Number(axes.wght.default),
					variable: variableOpts,
					src: [
						{
							url: makeFontFilePath(tag ?? id, subset, axesLower, style),
							format: 'woff2-variations',
						},
					],
					comment: `${tag ?? id}-${subset}-${axesLower}-${style}`,
				};

				// This takes in a font object and returns an @font-face block
				const css = generateFontFace(fontObj);
				cssStyle.push(css);
			}

			// Write down CSS
			const filename =
				style === 'normal' ? `${axesLower}.css` : `${axesLower}-${style}.css`;
			const css = cssStyle.join('\n\n');
			cssGenerate.push({
				filename,
				css,
			});

			// Some fonts may not have a wght axis, but usually have an opsz axis to compensate
			if (axesKey === 'wght') indexCSS = css;
			if (!indexCSS && axesKey === 'opsz') indexCSS = css;
		}
	}

	// Write down index.css for variable package
	cssGenerate.push({
		filename: 'index.css',
		css: indexCSS,
	});

	return cssGenerate;
};
