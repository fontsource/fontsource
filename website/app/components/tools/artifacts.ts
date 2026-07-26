import type { ConversionResult } from '@fontsource-utils/core';

interface ConversionSourceResult {
	sourceId: number;
	results: ConversionResult[];
}

interface ResolvedConversionArtifacts {
	artifacts: Array<ConversionResult & { sourceId: number }>;
	renamedArtifactCount: number;
}

const filenameKey = (filename: string): string =>
	filename.normalize('NFC').toLowerCase();

const appendSequence = (filename: string, sequence: number): string => {
	if (sequence === 1) return filename;

	const lastSlash = filename.lastIndexOf('/');
	const lastDot = filename.lastIndexOf('.');
	if (lastDot <= lastSlash + 1) {
		return `${filename}-${sequence}`;
	}

	return `${filename.slice(0, lastDot)}-${sequence}${filename.slice(lastDot)}`;
};

export const resolveConversionArtifacts = (
	sources: ConversionSourceResult[],
): ResolvedConversionArtifacts => {
	const usedFilenames = new Set<string>();
	const artifacts: ResolvedConversionArtifacts['artifacts'] = [];
	let renamedArtifactCount = 0;

	for (const source of sources) {
		let sequence = 1;
		let candidates = source.results.map((result) =>
			appendSequence(result.filename, sequence),
		);

		while (
			candidates.some((filename) => usedFilenames.has(filenameKey(filename)))
		) {
			sequence++;
			candidates = source.results.map((result) =>
				appendSequence(result.filename, sequence),
			);
		}

		for (const [index, result] of source.results.entries()) {
			let filename = candidates[index];
			while (usedFilenames.has(filenameKey(filename))) {
				sequence++;
				filename = appendSequence(result.filename, sequence);
			}

			usedFilenames.add(filenameKey(filename));
			if (filename !== result.filename) renamedArtifactCount++;
			artifacts.push({ ...result, filename, sourceId: source.sourceId });
		}
	}

	return { artifacts, renamedArtifactCount };
};
