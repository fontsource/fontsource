import { readdir, rm } from 'node:fs/promises';
import { join, posix } from 'node:path';
import type { GitSnapshot } from './git.ts';
import { loadProtoType, parseProto } from './protobuf.ts';
import { type SubsetDefinition, subsetDefinitionSchema } from './schema.ts';
import { compareStrings, pathExists, sha256, writeJson } from './shared.ts';

type Range = [string, string];

type SlicingStrategyProto = {
	subsets: Array<{ codepoints: number[] }>;
};

const slicingStrategyProto = loadProtoType(
	'./proto/nam-slicing.proto',
	'SlicingStrategy',
);

const normalizeCodepoints = (values: Iterable<number>): number[] => {
	const codepoints = Array.from(new Set(values)).toSorted(
		(left, right) => left - right,
	);
	for (const codepoint of codepoints) {
		if (
			!Number.isInteger(codepoint) ||
			codepoint < 0 ||
			codepoint > 0x10ffff ||
			(codepoint >= 0xd800 && codepoint <= 0xdfff)
		) {
			throw new Error(`Invalid Unicode scalar U+${codepoint.toString(16)}`);
		}
	}
	return codepoints;
};

export const codepointsToRanges = (values: Iterable<number>): Range[] => {
	const codepoints = normalizeCodepoints(values);
	const ranges: Array<[number, number]> = [];
	for (const codepoint of codepoints) {
		const previous = ranges.at(-1);
		if (previous && previous[1] + 1 === codepoint) {
			previous[1] = codepoint;
		} else {
			ranges.push([codepoint, codepoint]);
		}
	}
	return ranges.map(([start, end]) => [
		start.toString(16).toUpperCase(),
		end.toString(16).toUpperCase(),
	]);
};

export const parseNam = (source: string): number[] => {
	const codepoints: number[] = [];
	for (const [index, rawLine] of source
		.replaceAll('\r\n', '\n')
		.split('\n')
		.entries()) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const match = line.match(/^0x([0-9a-f]+)(?:\s|$)/i);
		if (!match?.[1]) throw new Error(`Invalid NAM line ${index + 1}: ${line}`);
		codepoints.push(Number.parseInt(match[1], 16));
	}
	return normalizeCodepoints(codepoints);
};

export const parseSlices = (source: string): number[][] => {
	const strategy = parseProto<SlicingStrategyProto>(
		slicingStrategyProto,
		source,
	);
	const slices = strategy.subsets.map((subset) =>
		normalizeCodepoints(subset.codepoints),
	);
	// Google stores the lowest-priority slice first; delivery order is reversed.
	return slices.toReversed();
};

const buildSubsetDefinition = (
	snapshot: GitSnapshot,
	id: string,
	path: string,
	contents: Buffer,
	ranges: Range[],
	slices?: SubsetDefinition['slices'],
): SubsetDefinition => {
	const lastChanged = snapshot.lastChanged(path);
	return subsetDefinitionSchema.parse({
		id,
		ranges,
		...(slices ? { slices } : {}),
		source: {
			upstream: 'namFiles',
			revision: lastChanged.revision,
			path,
			sha256: sha256(contents),
		},
	});
};

export const generateNam = async (
	snapshot: GitSnapshot,
	root: string,
): Promise<string[]> => {
	const definitions = new Map<string, SubsetDefinition>();

	for (const path of snapshot.paths.filter((path) =>
		/^Lib\/gfsubsets\/data\/[^/]+_unique-glyphs\.nam$/.test(path),
	)) {
		const filename = posix.basename(path);
		const id = filename
			.replace(/_unique-glyphs\.nam$/, '')
			.replaceAll('_', '-');
		const contents = snapshot.read(path);
		definitions.set(
			id,
			buildSubsetDefinition(
				snapshot,
				id,
				path,
				contents,
				codepointsToRanges(parseNam(contents.toString('utf8'))),
			),
		);
	}

	for (const path of snapshot.paths.filter((path) =>
		/^slices\/[^/]+_default\.txt$/.test(path),
	)) {
		const filename = posix.basename(path);
		const baseId = filename.replace(/_default\.txt$/, '').replaceAll('_', '-');
		const id = `${baseId}-web`;
		const contents = snapshot.read(path);
		const slices = parseSlices(contents.toString('utf8'));
		const union = new Set(slices.flat());
		definitions.set(
			id,
			buildSubsetDefinition(
				snapshot,
				id,
				path,
				contents,
				codepointsToRanges(union),
				slices.map((codepoints, sliceIndex) => ({
					id: String(sliceIndex + 1),
					ranges: codepointsToRanges(codepoints),
				})),
			),
		);
	}

	if (definitions.size === 0) throw new Error('No NAM definitions found');
	for (const [id, value] of Array.from(definitions).toSorted(
		([left], [right]) => compareStrings(left, right),
	)) {
		await writeJson(join(root, 'subsets', `${id}.json`), value);
	}

	const subsetDirectory = join(root, 'subsets');
	if (await pathExists(subsetDirectory)) {
		for (const filename of await readdir(subsetDirectory)) {
			if (
				filename.endsWith('.json') &&
				!definitions.has(filename.slice(0, -5))
			) {
				await rm(join(subsetDirectory, filename));
			}
		}
	}

	return Array.from(definitions.keys()).toSorted(compareStrings);
};
