/* eslint-disable no-await-in-loop */
import { generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import { APIv2 } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import { findClosest, makeFontFilePath } from '../utils';

const packagerV2 = async (id: string, opts: BuildOptions) => {
	const { family, styles, weights, variants, unicodeRange } = APIv2[id];

	// Find the weight for index.css in the case weight 400 does not exist.
	const indexWeight = findClosest(weights, 400);

	// Generate CSS
	const unicodeKeys = Object.keys(unicodeRange);

	for (const weight of weights) {
		for (const style of styles) {
			const cssStyle: string[] = [];

			for (const subset of unicodeKeys) {
				// Remove brackets from unicode subset
				const cleanedSubset = subset.replace('[', '').replace(']', '');

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
									cleanedSubset,
									weight,
									style,
									'woff2'
								),
								format: 'woff2' as const,
							},
							{
								url: makeFontFilePath(id, cleanedSubset, weight, style, 'woff'),
								format: 'woff' as const,
							},
						],
						comment: `${id}-${subset}-${weight}-${style}`,
						displayVar: true,
					};
					// This takes in a font object and returns an @font-face block
					const css = generateFontFace(fontObj);
					cssStyle.push(css);
				}
			}

			// Write down CSS
			if (style in variants[weight]) {
				if (style === 'normal') {
					const cssPath = path.join(opts.dir, `${weight}.css`);
					await fs.writeFile(cssPath, cssStyle.join('\n\n'));

					// Generate index CSS
					if (weight === indexWeight) {
						await fs.writeFile(
							path.join(opts.dir, 'index.css'),
							cssStyle.join('\n\n')
						);
					}
				} else {
					// If italic or else, define specific style CSS file
					const cssStylePath = path.join(opts.dir, `${weight}-${style}.css`);
					await fs.writeFile(cssStylePath, cssStyle.join('\n\n'));
				}
			}
		}
	}
};

export { packagerV2 };
