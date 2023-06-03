/* eslint-disable no-await-in-loop */
import { type FontObject, generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import {
	type APIIconResponse,
	APIIconStatic,
	APIIconVariable,
} from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import {
	findClosest,
	makeFontFilePath,
	makeVariableFontFilePath,
} from '../utils';

const packagerIconsStatic = async (id: string, opts: BuildOptions) => {
	const { family, styles, weights, subsets, variants } = APIIconStatic[id];

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
								url: makeFontFilePath(id, subset, weight, style, 'woff2'),
								format: 'woff2' as const,
							},
							{
								url: makeFontFilePath(id, subset, weight, style, 'woff'),
								format: 'woff' as const,
							},
						],
						comment: `${id}-${subset}-${weight}-${style}`,
					};
					// This takes in a font object and returns an @font-face block
					const css = generateFontFace(fontObj);

					if (style === 'normal') {
						let cssPath = path.join(opts.dir, `${weight}.css`);
						await fs.writeFile(cssPath, css);

						cssPath = path.join(opts.dir, `${subset}-${weight}.css`);
						await fs.writeFile(cssPath, css);
					} else {
						let cssPath = path.join(opts.dir, `${weight}-italic.css`);
						await fs.writeFile(cssPath, css);

						cssPath = path.join(opts.dir, `${subset}-${weight}-italic.css`);
						await fs.writeFile(cssPath, css);
					}
					cssSubset.push(css);
				}
			}

			// If the weight is index, generate index.css
			if (weight === indexWeight) {
				const cssIndexPath = path.join(opts.dir, 'index.css');
				await fs.writeFile(cssIndexPath, cssSubset.join('\n\n'));
			}

			const cssSubsetPath = path.join(opts.dir, `${subset}.css`);
			await fs.writeFile(cssSubsetPath, cssSubset.join('\n\n'));
		}
	}
};

const packagerIconsVariable = async (id: string, opts: BuildOptions) => {
	const icon = APIIconVariable[id];

	// Generate CSS
	let indexCSS = '';

	for (const axes of Object.keys(icon.variants)) {
		const variant = icon.variants[axes];
		const styles = Object.keys(variant);
		const axesLower = axes.toLowerCase();

		// These are variable modifiers to change specific CSS selectors
		// for variable fonts.
		const variableOpts: APIIconResponse['axes'] = {
			wght: icon.axes.wght,
		};
		if (axes === 'standard' || axes === 'full' || axes === 'wdth')
			variableOpts.stretch = icon.axes.wdth;

		if (axes === 'standard' || axes === 'full' || axes === 'slnt')
			variableOpts.slnt = icon.axes.slnt;

		// Generate variable CSS
		for (const style of styles) {
			const cssStyle: string[] = [];

			for (const subset of Object.keys(variant[style])) {
				const fontObj: FontObject = {
					family: icon.family,
					style,
					display: 'swap',
					weight: Number(icon.axes.wght.default),
					variable: variableOpts,
					src: [
						{
							url: makeVariableFontFilePath(id, subset, axesLower, style),
							format: 'woff2-variations',
						},
					],
					comment: `${id}-${subset}-${axesLower}-${style}`,
				};

				// This takes in a font object and returns an @font-face block
				const css = generateFontFace(fontObj);
				cssStyle.push(css);
			}

			// Write down CSS
			const filename =
				style === 'normal' ? `${axesLower}.css` : `${axesLower}-${style}.css`;
			const cssPath = path.join(opts.dir, filename);
			const css = cssStyle.join('\n\n');
			await fs.writeFile(cssPath, css);

			// Some fonts may not have a wght axis, but usually have an opsz axis to compensate
			if (axes === 'wght') indexCSS = css;
			if (!indexCSS && axes === 'opsz') indexCSS = css;
		}
	}

	// Write down index.css for variable package
	await fs.writeFile(path.join(opts.dir, 'index.css'), indexCSS);
};

export { packagerIconsStatic, packagerIconsVariable };
