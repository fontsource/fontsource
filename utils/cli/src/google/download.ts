import flatten from 'flat';
import fs from 'fs-extra';
import type { FontVariants, FontVariantsVariable } from 'google-font-metadata';
import { APIv1, APIv2, APIVariable } from 'google-font-metadata';
import got from 'got';
import stringify from 'json-stringify-pretty-compact';
import PQueue from 'p-queue';
import * as path from 'pathe';

import { BuildOptions } from '../types';
import { makeFontDownloadPath, makeVariableFontDownloadPath } from '../utils';

const gotDownload = async (url: string, dest: fs.PathLike) => {
	const response = await got(url);
	await fs.writeFile(dest, response);
};

// Parse API and split into variant + link array pairs.
const pairGenerator = (
	variants: FontVariants | FontVariantsVariable
): string[][] => {
	// [['weight.style.subset.url.extension', 'link to font or local name'], ...]
	const flattenedPairs: [string, string][] = Object.entries(flatten(variants));
	// Split ['weight.style.subset.url|local.extension'] into individual array elements
	const splitPairs = flattenedPairs.map(pair => [
		pair[0].split('.'),
		pair[1],
	]) as string[][];

	// Ensure that the pair has a valid URL to download
	const ABSOLUTE_URL_REGEX = /^https?:\/\//;
	const urlPairs = splitPairs.filter(pair =>
		ABSOLUTE_URL_REGEX.test(pair[1].toString())
	);

	// Filter out TTF and OTF files as they are not needed for NPM
	const cleanedPairs = urlPairs.filter(pair => {
		const extension = pair[0][4];
		if (extension === 'truetype' || extension === 'opentype') {
			return false;
		}
		return true;
	});

	return cleanedPairs;
};

interface DownloadLinks {
	url: string;
	dest: string;
}

// Generates pairs of URLs and destinations filtering unsupported formats
const generateLinks = (fontId: string): DownloadLinks[] => {
	const fontV1 = APIv1[fontId];
	const fontV2 = APIv2[fontId];
	const fontDir = `fonts/google/${fontId}`;

	// Parses variants into readable pairs of data
	let downloadURLPairsV1 = pairGenerator(fontV1.variants);
	const downloadURLPairsV2 = pairGenerator(fontV2.variants);

	// Flag to check whether font has unicode subsets like [132]
	let hasUnicodeSubsets = false;
	const re = /\[.*?]/g;
	for (const pair of downloadURLPairsV2) {
		if (re.test(pair[0][2])) {
			hasUnicodeSubsets = true;
		}
	}

	// If true, we need to download the woff2 files from V1. Else remove all woff2 files
	if (!hasUnicodeSubsets) {
		downloadURLPairsV1 = downloadURLPairsV1.filter(
			pair => pair[0][4] !== 'woff2'
		);
	}

	// V1 { url, dest } pairs
	const linksV1 = downloadURLPairsV1.map(pair => {
		const types = pair[0];
		const dest = makeFontDownloadPath(
			fontDir,
			fontId,
			types[2],
			Number(types[0]),
			types[1],
			types[4]
		);
		const url = pair[1];
		return {
			url,
			dest,
		};
	});

	// V2 { url, dest } pairs
	const linksV2Duplicates = downloadURLPairsV2.map(pair => {
		const types = pair[0];
		const dest =
			types[4] === 'woff2'
				? makeFontDownloadPath(
						fontDir,
						fontId,
						types[2].replace('[', '').replace(']', ''),
						Number(types[0]),
						types[1],
						types[4]
				  )
				: makeFontDownloadPath(
						fontDir,
						fontId,
						'all',
						Number(types[0]),
						types[1],
						types[4]
				  );
		const url = pair[1];
		return { url, dest };
	});

	// The "all" subset generates duplicates which need to be removed
	// Filters by removing duplicates with the same dest
	const linksV2 = [
		...new Map(linksV2Duplicates.map(item => [item.dest, item])).values(),
	];

	const links = [...linksV1, ...linksV2];
	return links;
};

const variableLinks = (fontId: string): DownloadLinks[] => {
	const fontVariable = APIVariable[fontId];
	const fontDir = `fonts/google/${fontId}`;

	const downloadURLPairsVariable = pairGenerator(fontVariable.variants);

	// Variable { url, dest } pairs
	// Types [type, style, subset]
	const links = downloadURLPairsVariable.map(pair => {
		const types = pair[0];
		const dest = makeVariableFontDownloadPath(
			fontDir,
			fontId,
			types[2],
			types[0],
			types[1]
		);
		const url = pair[1];
		return {
			url,
			dest,
		};
	});

	return links;
};

const queue = new PQueue({ concurrency: 60 });

const download = async (
	id: string,
	isVariable: boolean,
	opts: BuildOptions
) => {
	const fontDir = path.join(opts.dir, id);
	await fs.ensureDir(path.join(fontDir, 'files'));

	// Get download URLs of all font files
	const links = generateLinks(id);
	if (isVariable) {
		links.push(...variableLinks(id));
	}

	// Download all font files
	// Keep a list of all dests for checking successful downloads later
	const destArr: string[] = [];
	for (const link of links) {
		queue.add(() => gotDownload(link.url, link.dest));
		destArr.push(link.dest);
	}

	await queue.onIdle();
	await fs.writeFile(
		path.join(fontDir, 'files', 'file-list.json'),
		stringify(destArr)
	);
};

export { download, generateLinks, gotDownload, pairGenerator, variableLinks };
