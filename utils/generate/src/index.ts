import type { FontMetadata, FontObject } from './types';
import { findBoundaries } from './utils';

const generateSingle = (font: FontObject) => {
	const {
		family,
		style,
		display,
		weight,
		variable,
		src,
		unicodeRange,
		comment,
		spacer = '\n  ',
	} = font;
	// If variable, modify output
	const { wght, stretch, slnt } = variable ?? {};
	let result = '@font-face {';
	result += `${spacer}font-family: '${family}';`;

	// If slnt is present, switch to oblique style
	result += `${spacer}font-style: ${
		slnt ? `oblique ${slnt.max * -1}deg ${slnt.min * -1}deg` : style
	};`;
	result += `${spacer}font-display: ${display};`;
	// If variable wght is present, use min max wght vals
	result += `${spacer}font-weight: ${
		wght ? findBoundaries(wght).join(' ') : weight
	};`;

	if (stretch)
		result += `${spacer}font-stretch: ${stretch.min}% ${stretch.max}%;`;

	// Merges all formats into a single src
	result += `${spacer}src: ${src
		.map(({ url, format }) => `url(${url}) format('${format}')`)
		.join(', ')};`;

	if (unicodeRange) result += `${spacer}unicode-range: ${unicodeRange};`;

	if (comment) result = `/* ${comment} */\n${result}`;

	return `${result}\n}`;
};

const generateMulti = (metadata: FontMetadata) => {
	const {
		family,
		styles,
		display,
		weights,
		variable,
		path = '',
		subsets,
		unicodeRange,
		formats,
	} = metadata;
	const id = metadata.id ?? family.toLowerCase().replace(/\s/g, '-');
	let result = '';
	for (const style of styles) {
		for (const weight of weights) {
			for (const subset of subsets) {
				const fontObject: FontObject = {
					family,
					style,
					display,
					weight,
					variable,
					src: formats.map(format => ({
						url: `${path}${id}-${subset}-${weight}-${style}.${format}`,
						format,
					})),
					comment: subset,
				};

				if (unicodeRange) fontObject.unicodeRange = unicodeRange[subset];

				result += `${generateSingle(fontObject)}\n\n`;
			}
		}
	}
	// Slice last 2 \n if no minify
	return result.slice(0, -2);
};

export { generateMulti, generateSingle };
