/* eslint-disable no-await-in-loop */
import { type FontObject, generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import {
	APIv2,
	APIVariable,
	type FontObjectV2,
	type FontObjectVariable,
} from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions, CSSGenerate } from '../types';
import { findClosest, makeVariableFontFilePath } from '../utils';

const generateVariableCSS = (
	metadata: FontObjectV2['id'],
	variableMeta: FontObjectVariable['id'],
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
					family,
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

const packagerVariable = async (id: string, opts: BuildOptions) => {
	const font = APIv2[id];
	const fontVariable = APIVariable[id];

	const cssGenerate = generateVariableCSS(
		font,
		fontVariable,
		makeVariableFontFilePath,
	);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export { generateVariableCSS, packagerVariable };
