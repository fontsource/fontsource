import type { FontObject } from './types';
import { getVariableWght } from './utils';

const generateFontFace = (font: FontObject) => {
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
		slnt
			? `oblique ${Number(slnt.max) * -1}deg ${Number(slnt.min) * -1}deg`
			: style
	};`;
	result += `${spacer}font-display: ${display};`;
	// If variable wght is present, use min max wght vals
	result += `${spacer}font-weight: ${wght ? getVariableWght(wght) : weight};`;

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

export { generateFontFace };
export type { FontObject };
