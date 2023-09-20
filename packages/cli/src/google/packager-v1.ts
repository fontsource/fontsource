/* eslint-disable no-await-in-loop */
import { generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import { APIv1, type FontObjectV1 } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions, CSSGenerate } from '../types';
import { makeFontFilePath } from '../utils';

const generateV1CSS = (
	metadata: FontObjectV1['id'],
	makeFontFilePath: (
		id: string,
		subset: string,
		weight: string,
		style: string,
		extension: string,
	) => string,
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

const packagerV1 = async (id: string, opts: BuildOptions) => {
	const metadata = APIv1[id];
	const cssGenerate = generateV1CSS(metadata, makeFontFilePath);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export { generateV1CSS, packagerV1 };
