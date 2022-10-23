// Used to determine where the downloader should save the files
const makeFontDownloadPath = (
	fontDir: string,
	fontId: string,
	subset: string,
	weight: number,
	style: string,
	extension: string
): string =>
	`./${fontDir}/files/${fontId}-${subset}-${weight}-${style}.${extension}`;

const makeVariableFontDownloadPath = (
	fontDir: string,
	fontId: string,
	subset: string,
	axes: string,
	style: string
): string => `./${fontDir}/files/${fontId}-${subset}-${axes}-${style}.woff2`;

// Used for the src urls in CSS files
const makeFontFilePath = (
	fontId: string,
	subset: string,
	weight: number,
	style: string,
	extension: string
): string => `./files/${fontId}-${subset}-${weight}-${style}.${extension}`;

const makeVariableFontFilePath = (
	fontId: string,
	subset: string,
	axes: string,
	style: string
): string => `./files/${fontId}-${subset}-${axes}-${style}.woff2`;

// Insert a weight array to find the closest number given num - used for index.css gen
const findClosest = (arr: number[], num: number): number => {
	// Array of absolute values showing diff from target number
	const indexArr = arr.map(weight => Math.abs(Number(weight) - num));
	// Find smallest diff
	const min = Math.min(...indexArr);
	const closest = arr[indexArr.indexOf(min)];

	return closest;
};

export {
	findClosest,
	makeFontDownloadPath,
	makeFontFilePath,
	makeVariableFontDownloadPath,
	makeVariableFontFilePath,
};
