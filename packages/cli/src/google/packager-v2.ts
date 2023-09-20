/* eslint-disable no-await-in-loop */
import { generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import { APIv2, type FontObjectV2 } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions, CSSGenerate } from '../types';
import { findClosest, makeFontFilePath } from '../utils';

const generateV2CSS = (
	metadata: FontObjectV2['id'],
	makeFontFilePath: (
		id: string,
		subset: string,
		weight: string,
		style: string,
		extension: string,
	) => string,
): CSSGenerate => {
	const cssGenerate: CSSGenerate = [];
	const { id, family, styles, weights, variants, unicodeRange } = metadata;

	// Find the weight for index.css in the case weight 400 does not exist.
	const indexWeight = findClosest(weights, 400);

	// Generate CSS
	const unicodeKeys = Object.keys(unicodeRange);

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
						unicodeRange: unicodeRange[subset],
						src: [
							{
								url: makeFontFilePath(
									id,
									subset,
									String(weight),
									style,
									'woff2',
								),
								format: 'woff2' as const,
							},
							{
								url: makeFontFilePath(
									id,
									subset,
									String(weight),
									style,
									'woff',
								),
								format: 'woff' as const,
							},
						],
						comment: `${id}-${subset}-${weight}-${style}`,
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

const packagerV2 = async (id: string, opts: BuildOptions) => {
	const metadata = APIv2[id];
	const cssGenerate = generateV2CSS(metadata, makeFontFilePath);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export { generateV2CSS, packagerV2 };
