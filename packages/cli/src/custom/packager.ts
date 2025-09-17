import { generateFontFace } from '@fontsource-utils/generate';
import fs from 'fs-extra';
import path from 'pathe';

import type { Metadata } from '../types';
import { findClosest, makeFontFilePath } from '../utils';

interface PackagerOptions {
	dir?: string;
}

export const packagerCustom = async (
	metadata: Metadata,
	opts?: PackagerOptions,
) => {
	const { id, family, subsets, weights, styles } = metadata;
	const dir = opts?.dir ?? `./${id}`;

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
							url: makeFontFilePath(id, subset, String(weight), style, 'woff2'),
							format: 'woff2' as const,
						},
						{
							url: makeFontFilePath(id, subset, String(weight), style, 'woff'),
							format: 'woff' as const,
						},
					],
					comment: `${id}-${subset}-${weight}-${style}`,
				};
				// This takes in a font object and returns an @font-face block
				const css = generateFontFace(fontObj);

				// Needed to differentiate filenames for style CSS
				if (style === 'normal') {
					// Custom packager only supports 1 subset so it's safe to make this assumption
					await fs.writeFile(path.join(dir, `${weight}.css`), css);
					await fs.writeFile(path.join(dir, `${subset}-${weight}.css`), css);

					// Write index.css
					if (weight === indexWeight) {
						await fs.writeFile(path.join(dir, 'index.css'), css);
					}
					cssSubset.push(css);
				} else {
					await fs.writeFile(path.join(dir, `${weight}-${style}.css`), css);
					await fs.writeFile(
						path.join(dir, `${subset}-${weight}-${style}.css`),
						css,
					);

					// Write index.css if there is no normal style
					if (weight === indexWeight && styles.length === 1) {
						await fs.writeFile(path.join(dir, 'index.css'), css);
					}

					cssSubsetItalic.push(css);
				}
			}
		}

		// Write subset CSS files
		await fs.writeFile(path.join(dir, `${subset}.css`), cssSubset.join('\n\n'));

		// If there are italic styles for a subset
		if (cssSubsetItalic.length > 0) {
			await fs.writeFile(
				path.join(dir, `${subset}-italic.css`),
				cssSubsetItalic.join('\n\n'),
			);
		}
	}
};
