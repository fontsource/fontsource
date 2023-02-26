/* eslint-disable no-await-in-loop */
import { generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import path from 'pathe';

import { Metadata } from '../types';
import { findClosest, makeFontFilePath } from '../utils';

export const packagerCustom = async (metadata: Metadata) => {
	const { id, family, subsets, weights, styles } = metadata;
	const dir = `./${id}`;

	// Find the weight for index.css in the case weight 400 does not exist.
  const indexWeight = findClosest(weights, 400);

	// Write the CSS files
	for (const subset of subsets) {
		// Arrays of CSS blocks to be concatenated
		const cssSubset: string[] = [];
		const cssSubsetItalic: string[] = [];

		for (const weight of weights) {
			for (const style of styles) {
				const fontObj = {
					family,
					style,
					display: 'swap',
					weight,
					src: [
						{
							url: makeFontFilePath(id, subset, weight, style, 'woff2'),
							format: 'woff2',
						},
						{
							url: makeFontFilePath(id, subset, weight, style, 'woff'),
							format: 'woff',
						},
					],
					comment: `${id}-${subset}-${weight}-${style} CUSTOM`,
					displayVar: true,
				};
				// This takes in a font object and returns an @font-face block
				const css = generateFontFace(fontObj);

				// Needed to differentiate filenames
				if (style === 'normal') {
					await fs.writeFile(path.join(dir,`${subset}-${weight}.css`), css);
					cssSubset.push(css);
				} else {
					await fs.writeFile(path.join(dir,`${subset}-${weight}-${style}.css`), css);
					cssSubsetItalic.push(css);
				}
			}

			if (weight === indexWeight) {
				await fs.writeFile(path.join(dir,'index.css'), cssSubset.join('\n\n'));
			}

			await fs.writeFile(path.join(dir,`${subset}.css`), cssSubset.join('\n\n'));

			// If there are italic styles for a subset
			if (cssSubsetItalic.length > 0) {
				await fs.writeFile(path.join(dir,`${subset}-italic.css`), cssSubsetItalic.join('\n\n'));
			}
		}
	}
};
