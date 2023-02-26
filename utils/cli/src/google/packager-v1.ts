/* eslint-disable no-await-in-loop */
import { generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import { APIv1 } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import { makeFontFilePath } from '../utils';

const packagerV1 = async (id: string, opts: BuildOptions) => {
	const { family, styles, weights, subsets, variants } = APIv1[id];

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
								url: makeFontFilePath(id, subset, weight, style, 'woff2'),
								format: 'woff2',
							},
							{
								url: makeFontFilePath(id, subset, weight, style, 'woff'),
								format: 'woff',
							},
						],
						comment: `${id}-${subset}-${weight}-${style}`,
						displayVar: true,
					};
					// This takes in a font object and returns an @font-face block
					const css = generateFontFace(fontObj);

					// Needed to differentiate filenames
					if (style === 'normal') {
						const cssPath = path.join(opts.dir, `${subset}-${weight}.css`);
						await fs.writeFile(cssPath, css);

						cssSubset.push(css);
					} else {
						const cssStylePath = path.join(
							opts.dir,
							`${subset}-${weight}-${style}.css`
						);
						await fs.writeFile(cssStylePath, css);

						cssSubsetItalic.push(css);
					}
				}
			}
		}
		const cssSubsetPath = path.join(opts.dir, `${subset}.css`);
		await fs.writeFile(cssSubsetPath, cssSubset.join('\n\n'));

		// If there are italic styles for a subset
		if (cssSubsetItalic.length > 0) {
			const cssSubsetItalicPath = path.join(opts.dir, `${subset}-italic.css`);
			await fs.writeFile(cssSubsetItalicPath, cssSubsetItalic.join('\n\n'));
		}
	}
};

export { packagerV1 };
