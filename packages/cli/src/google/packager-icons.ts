/* eslint-disable no-await-in-loop */
import { type FontObject, generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import {
	type APIIconResponse,
	APIIconStatic,
	APIIconVariable,
	type FontObjectV2,
	type FontObjectVariable,
} from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions, CSSGenerate } from '../types';
import {
	findClosest,
	makeFontFilePath,
	makeVariableFontFilePath,
} from '../utils';

const generateIconStaticCSS = (
	metadata: FontObjectV2['id'],
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

const packagerIconsStatic = async (id: string, opts: BuildOptions) => {
	const cssGenerate = generateIconStaticCSS(
		APIIconStatic[id],
		makeFontFilePath,
	);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

const generateIconVariableCSS = (
	metadata: FontObjectVariable['id'],
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
					family,
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

const packagerIconsVariable = async (id: string, opts: BuildOptions) => {
	const icon = APIIconVariable[id];
	const cssGenerate = generateIconVariableCSS(icon, makeVariableFontFilePath);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export {
	generateIconStaticCSS,
	generateIconVariableCSS,
	packagerIconsStatic,
	packagerIconsVariable,
};
