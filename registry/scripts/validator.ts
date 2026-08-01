import { ok as assert, deepStrictEqual, strictEqual } from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import {
	getVariableAxisKeys,
	type VariableAxisConfig,
} from '@fontsource-utils/core';
import { consola } from 'consola';
import type { z } from 'zod';
import {
	axisRegistrySchema,
	type Family,
	type FamilyDistribution,
	type FamilyProvider,
	type FamilySource,
	familyDistributionSchema,
	familyIconsSchema,
	familyOverridesSchema,
	familyProviderSchema,
	familySchema,
	familyTagsSchema,
	type LanguageCatalog,
	languageCatalogSchema,
	replacementRegistrySchema,
	type SubsetDefinition,
	subsetDefinitionSchema,
	type Taxonomy,
	taxonomySchema,
	upstreamsSchema,
} from './schema.ts';
import {
	canonicalJson,
	compareStrings,
	normalizeText,
	pathExists,
	readJson,
} from './shared.ts';

const logger = consola.withTag('registry');

const parseFamilyKey = (
	key: string,
): { provider: FamilyProvider; id: string } => {
	const [provider, id, extra] = key.split('/');
	assert(provider && id && !extra, `Invalid family directory ${key}`);
	assert(
		/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id),
		`Invalid family directory ${key}`,
	);
	return { provider: familyProviderSchema.parse(provider), id };
};

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

const isVariationSelector = (codepoint: number): boolean =>
	// Variation sequences are inspected separately from the base cmap range.
	(codepoint >= 0xfe00 && codepoint <= 0xfe0f) ||
	(codepoint >= 0xe0100 && codepoint <= 0xe01ef);

const supportsCodepoint = (unicodeRange: string, codepoint: number): boolean =>
	unicodeRange.split(', ').some((range) => {
		const [startValue, endValue = startValue] = range.slice(2).split('-');
		const start = Number.parseInt(startValue ?? '', 16);
		const end = Number.parseInt(endValue ?? '', 16);
		return codepoint >= start && codepoint <= end;
	});

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
	font: FamilySource['inspection'],
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
	font: FamilySource['inspection'],
	weight: number,
): boolean =>
	typeof font.weight === 'number'
		? font.weight === weight
		: font.weight.min <= weight && font.weight.max >= weight;

const publishedAxisKeys = (
	font: FamilySource['inspection'],
): ReadonlySet<string> => {
	const axes: VariableAxisConfig = Object.fromEntries(
		font.axes.map((axis) => [
			axis.tag,
			{
				min: axis.min,
				max: axis.max,
				default: axis.default,
			},
		]),
	);
	return new Set(getVariableAxisKeys(axes));
};

export const resolveDistributionSources = (
	distribution: FamilyDistribution,
	family: Family,
	context: string,
): {
	static?: Array<
		NonNullable<FamilyDistribution['static']>[number] & { source: string }
	>;
	variable?: Array<
		NonNullable<FamilyDistribution['variable']>[number] & { source: string }
	>;
} => {
	// Every published entry must select one source without inventing a
	// weight/style cross-product or relying on source ordering.
	const fonts = family.sources.map((source) => ({
		font: source.inspection,
		source,
	}));
	const staticVariants = distribution.static?.map((variant) => {
		const staticMatches = fonts.filter(({ font, source }) => {
			if (font.axes.length > 0) return false;
			return source.variant
				? source.variant.weight === variant.weight &&
						source.variant.style === variant.style
				: fontSupportsWeight(font, variant.weight) &&
						fontSupportsStyle(font, variant.style);
		});
		if (staticMatches.length === 1) {
			return { ...variant, source: staticMatches[0].source.sha256 };
		}

		const variableMatches = fonts.filter(({ font, source }) => {
			if (font.axes.length === 0) return false;
			return (
				fontSupportsWeight(font, variant.weight) &&
				(fontSupportsStyle(font, variant.style) ||
					source.variant?.style === variant.style)
			);
		});
		if (staticMatches.length > 1 && variableMatches.length !== 1) {
			throw new Error(
				`${context} static ${variant.weight} ${variant.style} is ambiguous`,
			);
		}
		assert(
			variableMatches.length === 1,
			`${context} static ${variant.weight} ${variant.style} must resolve to one source`,
		);
		return { ...variant, source: variableMatches[0].source.sha256 };
	});

	const variableVariants = distribution.variable?.map((variant) => {
		const matches = fonts.filter(({ font, source }) => {
			if (
				font.axes.length === 0 ||
				(!fontSupportsStyle(font, variant.style) &&
					source.variant?.style !== variant.style)
			)
				return false;
			return publishedAxisKeys(font).has(variant.axisKey);
		});
		assert(
			matches.length === 1,
			`${context} variable ${variant.axisKey} ${variant.style} must resolve to one source`,
		);
		return { ...variant, source: matches[0].source.sha256 };
	});

	return { static: staticVariants, variable: variableVariants };
};

export const validateDistributionResolution = (
	distribution: FamilyDistribution,
	family: Family,
	context: string,
): void => {
	resolveDistributionSources(distribution, family, context);
};

const validateFamily = async (
	root: string,
	key: string,
	subsets: ReadonlyMap<string, SubsetDefinition>,
	taxonomy: Taxonomy,
	languages: LanguageCatalog,
): Promise<{ id: string; family: Family }> => {
	const { id } = parseFamilyKey(key);
	const directory = join(root, 'families', key);
	const family = await validateCanonicalJson(
		join(directory, 'family.json'),
		familySchema,
	);
	assertSortedUnique(
		family.classifications,
		(value) => value,
		`${id} classifications`,
	);
	assertSortedUnique(family.tags, (value) => value, `${id} tags`);
	for (const tag of family.tags) {
		assert(taxonomy.tags[tag], `${id} references unknown tag ${tag}`);
	}
	assertSortedUnique(family.languages, (value) => value, `${id} languages`);
	for (const language of family.languages) {
		assert(
			languages[language],
			`${id} references unknown language ${language}`,
		);
	}
	if (family.primaryLanguage) {
		assert(
			languages[family.primaryLanguage],
			`${id} references unknown primary language ${family.primaryLanguage}`,
		);
		assert(
			family.languages.includes(family.primaryLanguage),
			`${id} primary language is not included in its languages`,
		);
	}
	assertSortedUnique(family.sources, (file) => file.path, `${id} source files`);
	const licensePath = join(directory, 'license.txt');
	assert(await pathExists(licensePath), `${id} is missing license.txt`);
	const licenseText = await readFile(licensePath, 'utf8');
	assert(licenseText.trim(), `${id} license.txt is empty`);
	strictEqual(
		licenseText,
		normalizeText(licenseText),
		`${id} license.txt is not normalized`,
	);

	for (const source of family.sources) {
		const file = source.inspection;
		assertSortedUnique(
			file.colorTables,
			(table) => table,
			`${source.path} color tables`,
		);
		assertSortedUnique(file.axes, (axis) => axis.tag, `${source.path} axes`);
		let previousCodepoint = -2;
		let codepoints = 0;
		for (const range of file.unicodeRange.split(', ')) {
			const [startValue, endValue = startValue] = range.slice(2).split('-');
			const start = Number.parseInt(startValue ?? '', 16);
			const end = Number.parseInt(endValue ?? '', 16);
			assert(
				start <= end && end <= 0x10ffff,
				`${source.path} contains an invalid Unicode range`,
			);
			assert(
				start > previousCodepoint + 1,
				`${source.path} Unicode ranges must be sorted, disjoint, and minimal`,
			);
			codepoints += end - start + 1;
			previousCodepoint = end;
		}
		strictEqual(
			codepoints,
			file.codepoints,
			`${source.path} codepoint count does not match its Unicode range`,
		);
		for (const [table, features] of Object.entries(file.features)) {
			assertSortedUnique(
				features,
				(feature) => feature,
				`${source.path} ${table} features`,
			);
		}
		if (typeof file.weight !== 'number') {
			assert(
				file.weight.min <= file.weight.default &&
					file.weight.default <= file.weight.max,
				`${source.path} has an invalid weight range`,
			);
		}
		for (const axis of file.axes) {
			assert(
				axis.min <= axis.default && axis.default <= axis.max,
				`${source.path} has an invalid ${axis.tag} range`,
			);
		}
	}
	if (family.sampleText) {
		// Array.from iterates Unicode code points rather than UTF-16 code units.
		const codepoints = new Set(
			Array.from(Object.values(family.sampleText).join(''))
				.filter((character) => character.trim())
				.map((character) => character.codePointAt(0) as number)
				.filter((codepoint) => !isVariationSelector(codepoint)),
		);
		for (const source of family.sources) {
			for (const codepoint of codepoints) {
				assert(
					supportsCodepoint(source.inspection.unicodeRange, codepoint),
					`${id} sample text contains U+${codepoint
						.toString(16)
						.toUpperCase()
						.padStart(4, '0')} missing from ${source.path}`,
				);
			}
		}
	}

	const iconsPath = join(directory, 'icons.json');
	if (await pathExists(iconsPath)) {
		const manifest = await validateCanonicalJson(iconsPath, familyIconsSchema);
		assert(
			family.provenance.type === 'github',
			`${id} icon source repository is not defined by family provenance`,
		);
		assert(
			family.classifications.includes('symbols'),
			`${id} has icons but is not classified as symbols`,
		);
		assertSortedUnique(
			manifest.inputModes,
			(value) => value,
			`${id} icon input modes`,
		);
		assertSortedUnique(
			manifest.icons,
			(icon) => `${icon.name}\0${icon.codepoint.toString(16).padStart(6, '0')}`,
			`${id} icons`,
		);
	}

	const distributionPath = join(directory, 'distribution.json');
	assert(
		await pathExists(distributionPath),
		`${id} is missing distribution.json`,
	);
	const distribution = await validateCanonicalJson(
		distributionPath,
		familyDistributionSchema,
	);
	assertSortedUnique(
		distribution.static ?? [],
		(variant) => `${String(variant.weight).padStart(4, '0')}:${variant.style}`,
		`${id} static variants`,
	);
	assertSortedUnique(
		distribution.variable ?? [],
		(variant) => `${variant.axisKey.toLowerCase()}:${variant.style}`,
		`${id} variable variants`,
	);
	if (distribution.characters !== 'all') {
		const {
			defaultSubset,
			slicing,
			subsets: publicSubsets,
		} = distribution.characters;
		assertSortedUnique(
			publicSubsets,
			(subset) => subset.id,
			`${id} public subsets`,
		);
		assert(
			publicSubsets.some((subset) => subset.id === defaultSubset),
			`${id} default subset is not mapped`,
		);
		for (const subset of publicSubsets) {
			const definition = subsets.get(subset.definition);
			assert(
				definition,
				`${id} references missing subset ${subset.definition}`,
			);
			assert(
				!definition.slices,
				`${id} named subset ${subset.definition} must not be sliced`,
			);
		}
		if (slicing) {
			const definition = subsets.get(slicing);
			assert(definition, `${id} references missing slicing ${slicing}`);
			assert(definition.slices, `${id} slicing ${slicing} must contain slices`);
		}
	}
	validateDistributionResolution(distribution, family, id);
	return { id, family };
};

const validateSubset = async (
	root: string,
	id: string,
): Promise<SubsetDefinition> => {
	const definition = await validateCanonicalJson(
		join(root, 'subsets', `${id}.json`),
		subsetDefinitionSchema,
	);
	validateRanges(definition.ranges, id);
	if (!definition.slices) return definition;
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
	return definition;
};

export const listFiles = async (root: string): Promise<string[]> =>
	(await readdir(root, { recursive: true, withFileTypes: true }))
		.filter((entry) => !entry.isDirectory())
		.map((entry) =>
			relative(root, join(entry.parentPath, entry.name)).replaceAll('\\', '/'),
		)
		.toSorted(compareStrings);

export const listFamilyKeys = async (root: string): Promise<string[]> => {
	const keys: string[] = [];
	const familiesRoot = join(root, 'families');
	if (!(await pathExists(familiesRoot))) return keys;
	for (const provider of await readdir(familiesRoot, {
		withFileTypes: true,
	})) {
		if (!provider.isDirectory()) continue;
		for (const family of await readdir(join(familiesRoot, provider.name), {
			withFileTypes: true,
		})) {
			if (family.isDirectory()) keys.push(`${provider.name}/${family.name}`);
		}
	}
	return keys.toSorted(compareStrings);
};

export const listSubsetIds = async (root: string): Promise<string[]> => {
	const subsetsRoot = join(root, 'subsets');
	if (!(await pathExists(subsetsRoot))) return [];
	return (await readdir(subsetsRoot))
		.filter((filename) => filename.endsWith('.json'))
		.map((filename) => filename.slice(0, -5))
		.toSorted(compareStrings);
};

export const validateRegistry = async (root: string): Promise<void> => {
	await validateCanonicalJson(join(root, 'upstreams.json'), upstreamsSchema);
	const familyKeys = await listFamilyKeys(root);
	const subsetIds = await listSubsetIds(root);
	const subsets = new Map(
		await Promise.all(
			subsetIds.map(
				async (id) => [id, await validateSubset(root, id)] as const,
			),
		),
	);
	const familyIds = new Set<string>();
	for (const family of familyKeys) {
		const { id } = parseFamilyKey(family);
		assert(!familyIds.has(id), `Duplicate registry family ID ${id}`);
		familyIds.add(id);
	}
	const replacements = await validateCanonicalJson(
		join(root, 'replacements.json'),
		replacementRegistrySchema,
	);
	const taxonomy = await validateCanonicalJson(
		join(root, 'taxonomy.json'),
		taxonomySchema,
	);
	const familyTags = await validateCanonicalJson(
		join(root, 'family-tags.json'),
		familyTagsSchema,
	);
	const familyOverrides = await validateCanonicalJson(
		join(root, 'family-overrides.json'),
		familyOverridesSchema,
	);
	const languages = await validateCanonicalJson(
		join(root, 'languages.json'),
		languageCatalogSchema,
	);
	for (const [id, language] of Object.entries(languages)) {
		if (!language.requiredCodepoints) continue;
		deepStrictEqual(
			language.requiredCodepoints,
			Array.from(new Set(language.requiredCodepoints)).toSorted(
				(left, right) => left - right,
			),
			`${id} required codepoints must be sorted and unique`,
		);
	}
	for (const tag of Object.keys(taxonomy.tags)) {
		const group = tag.split('/')[0] as string;
		assert(
			taxonomy.tagGroups[group],
			`${tag} references unknown group ${group}`,
		);
	}

	let validated = 0;
	const families = await Promise.all(
		familyKeys.map(async (family) => {
			const validatedFamily = await validateFamily(
				root,
				family,
				subsets,
				taxonomy,
				languages,
			);
			validated += 1;
			if (validated % 250 === 0 && validated < familyKeys.length) {
				logger.info(
					`Validated ${validated}/${familyKeys.length} font families`,
				);
			}
			return validatedFamily;
		}),
	);
	const familiesById = new Map(families.map((family) => [family.id, family]));
	for (const [tag, ids] of Object.entries(familyTags)) {
		assert(taxonomy.tags[tag], `Curated family tag ${tag} does not exist`);
		assertSortedUnique(ids, (id) => id, `${tag} families`);
		for (const id of ids) {
			assert(familiesById.has(id), `${tag} references missing family ${id}`);
		}
	}
	for (const [id, override] of Object.entries(familyOverrides)) {
		const family = familiesById.get(id);
		assert(family, `Family override ${id} does not exist`);
		if (override.languages !== undefined) {
			deepStrictEqual(
				family.family.languages,
				override.languages,
				`${id} language override is not applied`,
			);
		}
		if (override.sampleText !== undefined) {
			deepStrictEqual(
				family.family.sampleText,
				override.sampleText,
				`${id} sample text override is not applied`,
			);
		}
	}
	for (const [id, replacedBy] of Object.entries(replacements)) {
		assert(id !== replacedBy, `${id} cannot replace itself`);
		const family = familiesById.get(id);
		assert(family, `Replacement source ${id} does not exist`);
		const replacement = familiesById.get(replacedBy);
		assert(replacement, `Replacement target ${replacedBy} does not exist`);
		strictEqual(family.family.status, 'deprecated', `${id} must be deprecated`);
		strictEqual(
			replacement.family.status,
			'active',
			`Replacement target ${replacedBy} must be active`,
		);
	}
	await validateCanonicalJson(join(root, 'axes.json'), axisRegistrySchema);

	const allowed = new Set<string>([
		'upstreams.json',
		'axes.json',
		'languages.json',
		'replacements.json',
		'taxonomy.json',
		'family-tags.json',
		'family-overrides.json',
		...subsetIds.map((id) => `subsets/${id}.json`),
	]);
	for (const family of familyKeys) {
		for (const filename of [
			'family.json',
			'icons.json',
			'license.txt',
			'distribution.json',
			'description.en-US.md',
			'article.en-US.md',
		]) {
			const path = `families/${family}/${filename}`;
			if (await pathExists(join(root, path))) allowed.add(path);
		}
	}
	for (const path of await listFiles(root)) {
		assert(allowed.has(path), `Unlisted or unsupported registry file: ${path}`);
	}
};

if (import.meta.main) {
	logger.start('Validating registry');
	await validateRegistry(join(import.meta.dirname, '..', 'data'));
	logger.success('Registry is valid');
}
