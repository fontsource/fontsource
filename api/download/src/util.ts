import { type IDResponse } from 'common-api/types';
import { splitTag } from 'common-api/util';
import { StatusError } from 'itty-router';

import { type Manifest } from './types';

export const generateManifestItem = (tag: string, file: string, metadata: IDResponse): Manifest => {
	const { id, version } = splitTag(tag);
	const [filename, extension] = file.split('.');
	const [subset, weight, style] = filename.split('-');
	if (!subset || !weight || !style) {
		throw new StatusError(400, 'Bad Request. Invalid filename.');
	}

	if (id !== metadata.id) {
		throw new StatusError(400, 'Bad Request. Invalid ID.');
	}

	return {
		id,
		subset,
		weight: Number(weight),
		style,
		variable: metadata.variable,
		extension,
		version,
		url: `https://cdn.jsdelivr.net/npm/@fontsource/${id}@${version}/files/${id}-${file}`,
	};
};

export const generateManifest = (
	tag: string,
	metadata: IDResponse,
): Manifest[] => {
	const { id, version } = splitTag(tag);

	if (id !== metadata.id) {
		throw new StatusError(400, 'Bad Request. Invalid ID.');
	}

	// Generate manifest
	const manifest: Manifest[] = [];

	// Unicode range is needed to include numbered subset files, but it may include duplicates
	const subsetKeys = [
		...new Set([
			...Object.keys(metadata.unicodeRange).map(
				(key) => key.replace('[', '').replace(']', ''), // Files should be stored without brackets
			),
			...metadata.subsets,
		]),
	];

	for (const subset of subsetKeys) {
		for (const weight of metadata.weights) {
			for (const style of metadata.styles) {
				for (const extension of ['woff2', 'woff']) {
					manifest.push({
						id,
						subset,
						weight,
						style,
						variable: metadata.variable,
						extension,
						version,
						// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
						url: `https://cdn.jsdelivr.net/npm/@fontsource/${metadata.id}@${version}/files/${metadata.id}-${subset}-${weight}-${style}.${extension}`,
					});
				}
			}
		}
	}

	return manifest;
};
