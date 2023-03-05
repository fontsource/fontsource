/* eslint-disable no-await-in-loop */
import { FontObject, generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import { APIv2, APIVariable } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import { findClosest, makeVariableFontFilePath } from '../utils';

const packagerVariable = async (id: string, opts: BuildOptions) => {
	const font = APIv2[id];
	const fontVariable = APIVariable[id];

	// Generate CSS
	let indexCSS = '';

	for (const axes of Object.keys(fontVariable.variants)) {
		const variant = fontVariable.variants[axes];
		const styles = Object.keys(variant);
		const axesLower = axes.toLowerCase();

		// These are variable modifiers to change specific CSS selectors
		// for variable fonts.
		const variableOpts: FontObject['variable'] = {
			wght: fontVariable.axes.wght,
		};
		if (axes === 'standard' || axes === 'full' || axes === 'wdth')
			variableOpts.stretch = fontVariable.axes.wdth;

		if (axes === 'standard' || axes === 'full' || axes === 'slnt')
			variableOpts.slnt = fontVariable.axes.slnt;

		for (const style of styles) {
			const cssStyle: string[] = [];

			for (const subset of Object.keys(variant[style])) {
				const fontObj: FontObject = {
					family: font.family,
					style,
					display: 'swap',
					weight: findClosest(font.weights, 400),
					unicodeRange: font.unicodeRange[subset],
					variable: variableOpts,
					src: [
						{
							url: makeVariableFontFilePath(id, subset, axesLower, style),
							format: 'woff2-variations',
						},
					],
					comment: `${id}-${subset}-${axesLower}-${style}`,
					displayVar: true,
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

export { packagerVariable };
