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

// Insert a weight array to find the closest number given num - used for index.css gen
const findClosest = (arr: number[], num: number): number => {
	// Array of absolute values showing diff from target number
	const indexArr = arr.map((weight) => Math.abs(Number(weight) - num));
	// Find smallest diff
	const min = Math.min(...indexArr);
	const closest = arr[indexArr.indexOf(min)];

	return closest;
};

export const updateCss = (
	tag: string,
	fileName: string,
	metadata: IDResponse,
) => {
	const { family, styles, subsets, weights, unicodeRange, defSubset } =
		metadata;
	const isIndex = fileName === 'index';
	let [subset, weight, style] = fileName.split('-');
	if (
		!isIndex &&
		(!subset ||
			!weight ||
			!style ||
			!subsets.includes(subset) ||
			!weights.includes(Number(weight)) ||
			!styles.includes(style))
	) {
		throw new StatusError(404, 'Not Found. Invalid filename.');
	}

	if (isIndex) {
		subset = defSubset;
		weight = String(findClosest(weights, 400));
		style = 'normal';
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
