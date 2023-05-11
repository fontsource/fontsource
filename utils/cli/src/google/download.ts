import flatten from 'flat';
import fs from 'fs-extra';
import type { FontVariants, FontVariantsVariable } from 'google-font-metadata';
import {
	APIIconStatic,
	APIIconVariable,
	APIv1,
	APIv2,
	APIVariable,
} from 'google-font-metadata';
import PQueue from 'p-queue';
import * as path from 'pathe';

import { BuildOptions } from '../types';
import { makeFontDownloadPath, makeVariableFontDownloadPath } from '../utils';

const writeDownload = async (url: string, dest: fs.PathLike) => {
	const response = await fetch(url).then(res => res.arrayBuffer());
	await fs.writeFile(dest, Buffer.from(response));
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
const generateLinks = (id: string, opts: BuildOptions): DownloadLinks[] => {
	const fontV1 = APIv1[id];
	const fontV2 = APIv2[id];

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
			opts.dir,
			id,
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
	const linksV2 = downloadURLPairsV2.map(pair => {
		const types = pair[0];
		const dest = makeFontDownloadPath(
			opts.dir,
			id,
			types[2].replace('[', '').replace(']', ''),
			Number(types[0]),
			types[1],
			types[4]
		);

		const url = pair[1];
		return { url, dest };
	});

	const links = [...linksV1, ...linksV2];
	return links;
};

const variableLinks = (id: string, opts: BuildOptions): DownloadLinks[] => {
	const fontVariable = APIVariable[id];

	const downloadURLPairsVariable = pairGenerator(fontVariable.variants);

	// Variable { url, dest } pairs
	// Types [type, style, subset]
	const links = downloadURLPairsVariable.map(pair => {
		const types = pair[0];
		const dest = makeVariableFontDownloadPath(
			opts.dir,
			id,
			types[2].replace('[', '').replace(']', ''),
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

const iconStaticLinks = (id: string, opts: BuildOptions): DownloadLinks[] => {
	const iconStatic = APIIconStatic[id];

	const downloadURLPairsIconStatic = pairGenerator(iconStatic.variants);

	// Icon Static { url, dest } pairs
	// Types [type, style, subset]
	const links = downloadURLPairsIconStatic.map(pair => {
		const types = pair[0];
		const dest = makeFontDownloadPath(
			opts.dir,
			id,
			types[2].replace('[', '').replace(']', ''),
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

	return links;
};

const iconVariableLinks = (id: string, opts: BuildOptions): DownloadLinks[] => {
	const iconVariable = APIIconVariable[id];

	const downloadURLPairsIconVariable = pairGenerator(iconVariable.variants);

	// Icon Variable { url, dest } pairs
	// Types [type, style, subset]
	const links = downloadURLPairsIconVariable.map(pair => {
		const types = pair[0];
		const dest = makeVariableFontDownloadPath(
			opts.dir,
			id,
			types[2].replace('[', '').replace(']', ''),
			types[0],
			types[1]
		);

		const url = pair[1];
		return { url, dest };
	});

	return links;
};

const queue = new PQueue({ concurrency: 30 });

const download = async (id: string, opts: BuildOptions) => {
	await fs.ensureDir(path.join(opts.dir, 'files'));

	// Get download URLs of font files
	let links: DownloadLinks[];
	if (opts.isIcon) {
		links = opts.isVariable
			? iconVariableLinks(id, opts)
			: iconStaticLinks(id, opts);
	} else {
		links = opts.isVariable ? variableLinks(id, opts) : generateLinks(id, opts);
	}

	// Download all font files
	for (const link of links) {
		queue.add(() => writeDownload(link.url, link.dest));
	}

	await queue.onIdle();
};

export {
	download,
	generateLinks,
	iconStaticLinks,
	iconVariableLinks,
	pairGenerator,
	variableLinks,
	writeDownload,
};
