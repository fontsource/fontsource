import { type FontObject, generateFontFace } from '@fontsource-utils/generate';
import { type IDResponse } from 'common-api/types';
import { StatusError } from 'itty-router';

const makeFontFilePath = (
	tag: string,
	subset: string,
	weight: string,
	style: string,
	extension: string,
) => {
	return `https://r2.fontsource.org/fonts/${tag}/${subset}-${weight}-${style}.${extension}`;
};

export const updateCss = (
	tag: string,
	fileName: string,
	metadata: IDResponse,
) => {
	const { family, styles, subsets, weights, unicodeRange } = metadata;
	const [subset, weight, style] = fileName.split('-');
	if (
		!subset ||
		!weight ||
		!style ||
		!subsets.includes(subset) ||
		!weights.includes(Number(weight)) ||
		!styles.includes(style)
	) {
		throw new StatusError(404, 'Not Found. Invalid filename.');
	}

	const fontObj: FontObject = {
		family,
		style,
		display: 'swap',
		weight: Number(weight),
		unicodeRange: unicodeRange[subset],
		src: [
			{
				url: makeFontFilePath(tag, subset, weight, style, 'woff2'),
				format: 'woff2' as const,
			},
			{
				url: makeFontFilePath(tag, subset, weight, style, 'woff'),
				format: 'woff' as const,
			},
		],
		comment: `${subset}`,
	};

	return generateFontFace(fontObj);
};
