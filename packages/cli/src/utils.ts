const cleanPaths = (str: string): string =>
	str.replace('[', '').replace(']', '');

// Used for the src urls in CSS files
const makeFontFilePath = (
	fontId: string,
	subset: string,
	weight: string,
	style: string,
	extension: string,
): string =>
	cleanPaths(`./files/${fontId}-${subset}-${weight}-${style}.${extension}`);

// Insert a weight array to find the closest number given num - used for index.css gen
const findClosest = (arr: number[], num: number): number => {
	// Array of absolute values showing diff from target number
	const indexArr = arr.map((weight) => Math.abs(Number(weight) - num));
	// Find smallest diff
	const min = Math.min(...indexArr);
	const closest = arr[indexArr.indexOf(min)];

	return closest;
};

const licenseMap = {
	'apache license, version 2.0': 'Apache-2.0',
	'sil open font license, 1.1': 'OFL-1.1',
	'ubuntu font license, 1.0': 'UFL-1.0',
	'mit license': 'MIT',
	'cc0-1.0': 'CC0-1.0',
};

export const licenseShort = (license: string): string | undefined =>
	licenseMap[license.toLowerCase() as keyof typeof licenseMap];

export { findClosest, makeFontFilePath };
