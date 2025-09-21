import { filter, map, pipe, reduce, toArray } from 'lfi';
import type { FontBuildConfig, SubsetDefinition } from './types';
import { codepointsToRangeString } from './utils';

/**
 * Parses the simple .nam file format which contains one codepoint per line.
 */
const parseNamFile = (content: string): number[] => {
	return pipe(
		content.split('\n'),
		map((line) => line.trim()),
		filter((line) => line.startsWith('0x')),
		map((line) => parseInt(line.split(' ')[0], 16)),
		reduce(toArray()),
	);
};

/**
 * Parses the text protobuf format for slicing strategies.
 */
const parseSlicingStrategy = (fileContent: string): number[][] => {
	const slices: number[][] = [];
	let currentSlice: number[] | null = null;

	for (const line of fileContent.split('\n')) {
		const trimmedLine = line.trim();
		if (trimmedLine === 'subsets {') {
			if (currentSlice) slices.push(currentSlice);
			currentSlice = [];
		} else if (trimmedLine.startsWith('codepoints:')) {
			const codepointMatch = trimmedLine.match(/codepoints: (\d+)/);
			if (codepointMatch && currentSlice) {
				currentSlice.push(parseInt(codepointMatch[1], 10));
			}
		} else if (trimmedLine === '}') {
			if (currentSlice && currentSlice.length > 0) {
				slices.push(currentSlice);
				currentSlice = null;
			}
		}
	}
	// The files list subsets in reverse priority order. We want to process them in priority order.
	return slices.reverse();
};

/**
 * Generates the complete subset data map from raw file contents provided in the config.
 */
export const generateSubsetData = (
	config: FontBuildConfig,
): Map<string, SubsetDefinition> => {
	const subsetData = new Map<string, SubsetDefinition>();

	for (const name of config.subsets) {
		const fileContent = config.subsetSources?.[name];
		if (!fileContent) {
			console.warn(`WARN: No subset file content provided for ${name}`);
			continue;
		}

		// A slicing strategy file will contain "subsets {" blocks.
		// Google-generated files don't have SlicingStrategy wrapper, just raw subset blocks
		if (fileContent.includes('subsets {')) {
			const slices = parseSlicingStrategy(fileContent);
			subsetData.set(name, {
				name,
				type: 'sliced',
				slices: slices.map((codepoints, i) => ({ index: i + 1, codepoints })),
			});
		} else {
			const codepoints = parseNamFile(fileContent);
			const unicodeRange = codepointsToRangeString(codepoints);
			subsetData.set(name, { name, type: 'range', unicodeRange, codepoints });
		}
	}
	return subsetData;
};
