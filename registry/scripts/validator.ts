import { ok as assert, deepStrictEqual, strictEqual } from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { z } from 'zod';
import {
	axisRegistrySchema,
	type FamilyInspection,
	type FamilyMetadata,
	type FamilyPolicy,
	familyInspectionSchema,
	familyMetadataSchema,
	familyPolicySchema,
	registryIndexSchema,
	subsetDefinitionSchema,
} from './schema.ts';
import {
	canonicalJson,
	compareStrings,
	pathExists,
	readJson,
} from './shared.ts';

const assertSortedUnique = <Value>(
	values: readonly Value[],
	key: (value: Value) => string,
	context: string,
): void => {
	const keys = values.map(key);
	deepStrictEqual(
		keys,
		Array.from(new Set(keys)).toSorted(compareStrings),
		`${context} must be sorted and unique`,
	);
};

const validateCanonicalJson = async <Schema extends z.ZodType>(
	path: string,
	schema: Schema,
): Promise<z.output<Schema>> => {
	const value = schema.parse(await readJson(path));
	strictEqual(
		await readFile(path, 'utf8'),
		canonicalJson(value),
		`${path} is not canonical JSON`,
	);
	return value;
};

const numericRange = (range: readonly [string, string]): [number, number] => [
	Number.parseInt(range[0], 16),
	Number.parseInt(range[1], 16),
];

const validateRanges = (
	ranges: ReadonlyArray<readonly [string, string]>,
	context: string,
): void => {
	let previousEnd = -2;
	for (const range of ranges) {
		const [start, end] = numericRange(range);
		assert(start <= end, `${context} contains a reversed range`);
		assert(end <= 0x10ffff, `${context} exceeds Unicode`);
		assert(
			!(start <= 0xdfff && end >= 0xd800),
			`${context} contains a surrogate`,
		);
		assert(
			start > previousEnd + 1,
			`${context} ranges must be sorted, disjoint, and minimal`,
		);
		previousEnd = end;
	}
};

const expandRanges = (
	ranges: ReadonlyArray<readonly [string, string]>,
): Set<number> => {
	const values = new Set<number>();
	for (const range of ranges) {
		const [start, end] = numericRange(range);
		for (let value = start; value <= end; value += 1) values.add(value);
	}
	return values;
};

const fontSupportsStyle = (
	font: FamilyInspection['files'][number],
	style: 'normal' | 'italic',
): boolean => {
	const italicAxis = font.axes.find(
		(axis) => axis.tag.toLowerCase() === 'ital',
	);
	if (style === 'italic') {
		return font.style === 'italic' || (italicAxis?.max ?? 0) >= 1;
	}
	return (
		font.style === 'normal' ||
		Boolean(italicAxis && italicAxis.min <= 0 && italicAxis.max >= 0)
	);
};

const fontSupportsWeight = (
	font: FamilyInspection['files'][number],
	weight: number,
): boolean =>
	typeof font.weight === 'number'
		? font.weight === weight
		: font.weight.min <= weight && font.weight.max >= weight;

export const validatePolicyResolution = (
	policy: FamilyPolicy,
	metadata: FamilyMetadata,
	inspection: FamilyInspection,
	context: string,
): void => {
	// Every explicit policy entry must select one source without inventing a
	// weight/style cross-product or relying on source ordering.
	const sourceFiles = new Map(
		metadata.sourceFiles.map((source) => [source.path, source]),
	);
	const fonts = inspection.files.map((font) => {
		const source = sourceFiles.get(font.path);
		assert(source, `${context} has no source metadata for ${font.path}`);
		return { font, source };
	});
	for (const variant of policy.packages.static?.variants ?? []) {
		const staticMatches = fonts.filter(
			({ font, source }) =>
				font.axes.length === 0 &&
				source.variant?.weight === variant.weight &&
				source.variant.style === variant.style,
		);
		if (staticMatches.length > 1) {
			throw new Error(
				`${context} static ${variant.weight} ${variant.style} is ambiguous`,
			);
		}
		if (staticMatches.length === 1) continue;

		const variableMatches = fonts.filter(({ font, source }) => {
			if (font.axes.length === 0 || !source.variant) return false;
			return (
				fontSupportsWeight(font, variant.weight) &&
				(fontSupportsStyle(font, variant.style) ||
					source.variant.style === variant.style)
			);
		});
		assert(
			variableMatches.length === 1,
			`${context} static ${variant.weight} ${variant.style} must resolve to one source`,
		);
	}

	for (const variant of policy.packages.variable?.variants ?? []) {
		const matches = fonts.filter(({ font, source }) => {
			if (
				font.axes.length === 0 ||
				!source.variant ||
				(!fontSupportsStyle(font, variant.style) &&
					source.variant.style !== variant.style)
			)
				return false;
			if (variant.axisKey === 'standard' || variant.axisKey === 'full')
				return true;
			return font.axes.some(
				(axis) => axis.tag.toLowerCase() === variant.axisKey.toLowerCase(),
			);
		});
		assert(
			matches.length === 1,
			`${context} variable ${variant.axisKey} ${variant.style} must resolve to one source`,
		);
	}
};

const validateFamily = async (
	root: string,
	id: string,
	subsets: ReadonlySet<string>,
): Promise<void> => {
	const directory = join(root, 'families', id);
	const metadata = await validateCanonicalJson(
		join(directory, 'metadata.json'),
		familyMetadataSchema,
	);
	const inspection = await validateCanonicalJson(
		join(directory, 'inspection.json'),
		familyInspectionSchema,
	);
	assert(metadata.id === id, `${id} metadata ID does not match its directory`);
	assertSortedUnique(
		metadata.declaredSubsets,
		(value) => value,
		`${id} declared subsets`,
	);
	assertSortedUnique(
		metadata.sourceFiles,
		(file) => file.path,
		`${id} source files`,
	);
	assertSortedUnique(
		inspection.files,
		(file) => file.path,
		`${id} inspection files`,
	);
	deepStrictEqual(
		metadata.sourceFiles.map((file) => file.path),
		inspection.files.map((file) => file.path),
		`${id} source and inspection paths differ`,
	);

	for (const file of inspection.files) {
		assertSortedUnique(
			file.colorTables,
			(table) => table,
			`${file.path} color tables`,
		);
		assertSortedUnique(file.axes, (axis) => axis.tag, `${file.path} axes`);
		if (typeof file.weight !== 'number') {
			assert(
				file.weight.min <= file.weight.default &&
					file.weight.default <= file.weight.max,
				`${file.path} has an invalid weight range`,
			);
		}
		for (const axis of file.axes) {
			assert(
				axis.min <= axis.default && axis.default <= axis.max,
				`${file.path} has an invalid ${axis.tag} range`,
			);
		}
	}

	const policyPath = join(directory, 'policy.json');
	if (!(await pathExists(policyPath))) return;
	const policy = await validateCanonicalJson(policyPath, familyPolicySchema);
	assert(
		Boolean(policy.packages.static || policy.packages.variable),
		`${id} policy has no package profile`,
	);
	assertSortedUnique(
		policy.packages.static?.variants ?? [],
		(variant) => `${String(variant.weight).padStart(4, '0')}:${variant.style}`,
		`${id} static variants`,
	);
	assertSortedUnique(
		policy.packages.variable?.variants ?? [],
		(variant) => `${variant.axisKey}:${variant.style}`,
		`${id} variable variants`,
	);
	const subsetIds = new Set(policy.subsets.map((subset) => subset.id));
	assert(
		subsetIds.has(policy.defaultSubset),
		`${id} default subset is not mapped`,
	);
	assert(
		subsetIds.size === policy.subsets.length,
		`${id} has duplicate public subsets`,
	);
	for (const subset of policy.subsets) {
		assert(
			subsets.has(subset.definition),
			`${id} references missing subset ${subset.definition}`,
		);
	}
	validatePolicyResolution(policy, metadata, inspection, id);
};

const validateSubset = async (root: string, id: string): Promise<void> => {
	const definition = await validateCanonicalJson(
		join(root, 'subsets', `${id}.json`),
		subsetDefinitionSchema,
	);
	assert(definition.id === id, `${id} subset ID does not match its filename`);
	validateRanges(definition.ranges, id);
	if (!definition.slices) return;
	assertSortedUnique(
		definition.slices,
		(slice) => String(Number(slice.id)).padStart(8, '0'),
		`${id} slices`,
	);
	const union = new Set<number>();
	for (const slice of definition.slices) {
		validateRanges(slice.ranges, `${id} slice ${slice.id}`);
		for (const codepoint of expandRanges(slice.ranges)) {
			assert(
				!union.has(codepoint),
				`${id} slices overlap at U+${codepoint.toString(16)}`,
			);
			union.add(codepoint);
		}
	}
	const expected = expandRanges(definition.ranges);
	deepStrictEqual(union, expected, `${id} slice union differs from its ranges`);
};

const listFiles = async (root: string): Promise<string[]> =>
	(await readdir(root, { recursive: true, withFileTypes: true }))
		.filter((entry) => !entry.isDirectory())
		.map((entry) =>
			relative(root, join(entry.parentPath, entry.name)).replaceAll('\\', '/'),
		)
		.toSorted(compareStrings);

export const validateRegistry = async (root: string): Promise<void> => {
	const index = await validateCanonicalJson(
		join(root, 'index.json'),
		registryIndexSchema,
	);
	assertSortedUnique(index.families, (value) => value, 'Registry families');
	assertSortedUnique(index.subsets, (value) => value, 'Registry subsets');

	const actualFamilies = (
		await readdir(join(root, 'families'), { withFileTypes: true })
	)
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.toSorted(compareStrings);
	deepStrictEqual(
		actualFamilies,
		index.families,
		'Registry family index does not match family directories',
	);
	const actualSubsets = (await readdir(join(root, 'subsets')))
		.filter((filename) => filename.endsWith('.json'))
		.map((filename) => filename.slice(0, -5))
		.toSorted(compareStrings);
	deepStrictEqual(
		actualSubsets,
		index.subsets,
		'Registry subset index does not match subset files',
	);

	const subsetSet = new Set(index.subsets);
	for (const id of index.families) await validateFamily(root, id, subsetSet);
	for (const id of index.subsets) await validateSubset(root, id);
	await validateCanonicalJson(join(root, 'axes.json'), axisRegistrySchema);

	const allowed = new Set<string>([
		'index.json',
		'axes.json',
		...index.subsets.map((id) => `subsets/${id}.json`),
	]);
	for (const id of index.families) {
		for (const filename of [
			'metadata.json',
			'inspection.json',
			'license.txt',
			'policy.json',
			'description.en-US.md',
			'article.en-US.md',
		]) {
			const path = `families/${id}/${filename}`;
			if (await pathExists(join(root, path))) allowed.add(path);
		}
	}
	for (const path of await listFiles(root)) {
		assert(allowed.has(path), `Unlisted or unsupported registry file: ${path}`);
	}
};

if (import.meta.main) {
	await validateRegistry(join(import.meta.dirname, '..', 'data'));
}
