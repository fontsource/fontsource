import { mkdir, rm, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { createFontContext, inspectFont } from '@fontsource-utils/core';
import { consola } from 'consola';
import { parse } from 'csv-parse/sync';
import TurndownService from 'turndown';
import type { GitSnapshot } from './git.ts';
import { normalizeInspection } from './inspection.ts';
import { createLanguageMatcher, type FontCoverage } from './languages.ts';
import { loadProtoType, parseProto } from './protobuf.ts';
import {
	axisRegistrySchema,
	type FamilyInspection,
	type FamilyMetadata,
	familyInspectionSchema,
	familyMetadataSchema,
	type LanguageCatalog,
	languageCatalogSchema,
	type Taxonomy,
} from './schema.ts';
import {
	compareStrings,
	normalizeText,
	readJson,
	sha256,
	writeJson,
} from './shared.ts';

const logger = consola.withTag('registry');

type GoogleFont = {
	filename: string;
	weight: number;
	style: 'normal' | 'italic';
	copyright?: string;
};

type GoogleSampleText = NonNullable<FamilyMetadata['sampleText']>;

const SAMPLE_TEXT_FIELDS = [
	'masthead_full',
	'masthead_partial',
	'styles',
	'tester',
	'poster_sm',
	'poster_md',
	'poster_lg',
	'specimen_48',
	'specimen_36',
	'specimen_32',
	'specimen_21',
	'specimen_16',
] as const;

type GoogleRawSampleText = Partial<
	Record<(typeof SAMPLE_TEXT_FIELDS)[number], string>
>;

type GoogleFamily = {
	name: string;
	designer: string;
	license: string;
	category: string;
	dateAdded: string;
	fonts: GoogleFont[];
	subsets: string[];
	stroke?: string;
	classifications: string[];
	displayName?: string;
	project?: { repository: string; revision?: string };
	languages: string[];
	primaryLanguage?: string;
	primaryScript?: string;
	sampleText?: GoogleSampleText;
};

type GoogleFamilyProto = {
	name: string;
	designer: string;
	license: string;
	category: string[];
	date_added: string;
	fonts: Array<{
		style: string;
		weight: number;
		filename: string;
		copyright?: string;
	}>;
	subsets: string[];
	stroke?: string;
	classifications: string[];
	display_name?: string;
	source?: { repository_url?: string; commit?: string };
	languages: string[];
	primary_language?: string;
	primary_script?: string;
	sample_text?: GoogleRawSampleText;
};

type GoogleAxisProto = {
	tag?: string;
	display_name?: string;
	description?: string;
	min_value?: number;
	max_value?: number;
	default_value?: number;
	precision?: number;
};

type GoogleLanguageProto = {
	id?: string;
	language?: string;
	script?: string;
	name?: string;
	preferred_name?: string;
	autonym?: string;
	exemplar_chars?: {
		base?: string;
		not_required?: string;
	};
	sample_text?: GoogleRawSampleText;
};

const familyProto = loadProtoType(
	'./proto/google-fonts.proto',
	'google.fonts_public.FamilyProto',
);
const axisProto = loadProtoType('./proto/google-axis.proto', 'AxisProto');
const languageProto = loadProtoType(
	'./proto/google-languages.proto',
	'google.languages_public.LanguageProto',
);

const normalizeSampleText = (
	value: GoogleRawSampleText | undefined,
): GoogleSampleText | undefined => {
	const styles = value?.styles?.trim();
	const tester = value?.tester?.trim();
	return styles || tester
		? {
				...(styles ? { styles } : {}),
				...(tester ? { tester } : {}),
			}
		: undefined;
};

const normalizeProject = (
	repository: string | undefined,
	revision: string | undefined,
): GoogleFamily['project'] => {
	if (!repository) return undefined;
	const url = new URL(repository);
	if (url.protocol !== 'https:') {
		throw new Error(`Unsupported project URL ${repository}`);
	}
	return {
		repository: url.toString().replace(/\/$/, ''),
		...(revision?.trim() ? { revision: revision.trim() } : {}),
	};
};

export const parseGoogleFamily = (source: string): GoogleFamily => {
	const family = parseProto<GoogleFamilyProto>(familyProto, source);
	const category = family.category.at(-1);
	if (!category) throw new Error('Missing Google category');
	const sampleText = normalizeSampleText(family.sample_text);

	const fonts = family.fonts.map((font): GoogleFont => {
		const style = font.style;
		if (style !== 'normal' && style !== 'italic') {
			throw new Error(`Unsupported Google font style ${style}`);
		}
		return {
			filename: font.filename,
			weight: font.weight,
			style,
			...(font.copyright ? { copyright: font.copyright } : {}),
		};
	});
	if (fonts.length === 0)
		throw new Error('Google family has no declared fonts');

	const project = family.source
		? normalizeProject(family.source.repository_url, family.source.commit)
		: undefined;

	return {
		name: family.name,
		designer: family.designer,
		license: family.license,
		category,
		dateAdded: family.date_added,
		fonts,
		subsets: family.subsets,
		...(family.stroke ? { stroke: family.stroke } : {}),
		classifications: family.classifications ?? [],
		...(family.display_name ? { displayName: family.display_name } : {}),
		...(project ? { project } : {}),
		languages: family.languages,
		...(family.primary_language
			? { primaryLanguage: family.primary_language }
			: {}),
		...(family.primary_script ? { primaryScript: family.primary_script } : {}),
		...(sampleText ? { sampleText } : {}),
	};
};

// Braces group grapheme sequences in Google exemplars. Font cmap support is
// determined by both their original and NFC-normalized component codepoints.
const exemplarCodepoints = (value: string): number[] => {
	const codepoints = new Set<number>();
	for (const token of value.split(/\s+/u)) {
		if (!token) continue;
		const characters =
			token.length > 1 ? token.replace(/^\{+|\}+$/gu, '') : token;
		for (const form of [characters, characters.normalize('NFC')]) {
			for (const character of form) {
				codepoints.add(character.codePointAt(0) as number);
			}
		}
	}
	return [...codepoints].toSorted((left, right) => left - right);
};

const sampleTextCodepoints = (
	value: GoogleRawSampleText | undefined,
): number[] => {
	const codepoints = new Set<number>();
	const text = SAMPLE_TEXT_FIELDS.map((field) => value?.[field] ?? '').join(
		'\n',
	);
	for (const form of [text, text.normalize('NFC')]) {
		for (const character of form) {
			if (/[\p{P}\p{Z}\s]/u.test(character)) continue;
			codepoints.add(character.codePointAt(0) as number);
		}
	}
	return [...codepoints].toSorted((left, right) => left - right);
};

const readGoogleLanguages = (snapshot: GitSnapshot): LanguageCatalog => {
	const paths = snapshot.paths.filter((path) =>
		/^lang\/Lib\/gflanguages\/data\/languages\/[^/]+\.textproto$/.test(path),
	);
	if (paths.length === 0)
		throw new Error('No Google language metadata files found');

	const catalog: Record<string, unknown> = {};
	for (const path of paths) {
		const language = parseProto<GoogleLanguageProto>(
			languageProto,
			snapshot.read(path).toString('utf8'),
		);
		const id = language.id ?? '';
		if (basename(path, '.textproto') !== id) {
			throw new Error(`Google language ID does not match ${path}`);
		}
		const sampleText = normalizeSampleText(language.sample_text);
		const base = language.exemplar_chars?.base;
		const ignored = new Set(
			exemplarCodepoints(language.exemplar_chars?.not_required ?? ''),
		);
		const requiredCodepoints = (
			base
				? exemplarCodepoints(base)
				: sampleTextCodepoints(language.sample_text)
		).filter((codepoint) => !ignored.has(codepoint));
		catalog[id] = {
			language: language.language,
			script: language.script,
			name: language.name,
			...(language.preferred_name
				? { preferredName: language.preferred_name }
				: {}),
			...(language.autonym ? { autonym: language.autonym } : {}),
			...(sampleText ? { sampleText } : {}),
			...(requiredCodepoints.length > 0 ? { requiredCodepoints } : {}),
		};
	}

	return languageCatalogSchema.parse(catalog);
};

type FontClassification = FamilyMetadata['classifications'][number];

const GOOGLE_CLASSIFICATION_MAP: Record<string, FontClassification> = {
	DISPLAY: 'display',
	HANDWRITING: 'handwriting',
	MONOSPACE: 'monospace',
	SANS_SERIF: 'sans-serif',
	SERIF: 'serif',
	SLAB_SERIF: 'slab-serif',
	SYMBOLS: 'symbols',
};

const STRUCTURAL_CLASSIFICATIONS = new Set<FontClassification>([
	'sans-serif',
	'serif',
	'slab-serif',
]);

const normalizeGoogleClassifications = (
	family: GoogleFamily,
): FontClassification[] => {
	const classifications = new Set<FontClassification>();
	for (const value of [family.stroke, ...family.classifications]) {
		if (!value) continue;
		const classification = GOOGLE_CLASSIFICATION_MAP[value];
		if (!classification) {
			throw new Error(
				`${family.name} has unsupported Google classification ${value}`,
			);
		}
		classifications.add(classification);
	}

	const category = GOOGLE_CLASSIFICATION_MAP[family.category];
	if (!category) {
		throw new Error(
			`${family.name} has unsupported Google category ${family.category}`,
		);
	}
	if (
		!STRUCTURAL_CLASSIFICATIONS.has(category) ||
		![...classifications].some((value) => STRUCTURAL_CLASSIFICATIONS.has(value))
	) {
		classifications.add(category);
	}
	return [...classifications].toSorted(compareStrings);
};

// Google scores degrees and variable coordinates; Fontsource publishes only
// strong whole-family assertions as binary discovery tags.
const MIN_GOOGLE_TAG_SCORE = 50;
const IGNORED_GOOGLE_TAGS = new Set([
	'display/display',
	'monospace/monospace',
	'not-text/symbols',
	'special-use/symbols',
]);

const normalizeGoogleTag = (value: string): string => {
	const parts = value
		.split('/')
		.filter(Boolean)
		.map((part) =>
			part
				.toLowerCase()
				.replace(/['’]/g, '')
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-|-$/g, ''),
		);
	if (parts.length !== 2 || parts.some((part) => !part)) {
		throw new Error(`Unsupported Google tag ${value}`);
	}
	return parts.join('/');
};

const readGoogleTags = (
	snapshot: GitSnapshot,
	taxonomy: Taxonomy,
): Map<string, string[]> => {
	const path = 'tags/all/families.csv';
	if (!snapshot.paths.includes(path)) {
		throw new Error(`Missing Google tag assignments at ${path}`);
	}
	const tagsByFamily = new Map<string, Set<string>>();
	const rows = parse(snapshot.read(path), {
		skip_empty_lines: true,
	}) as string[][];
	for (const [index, row] of rows.entries()) {
		if (row.length !== 4) {
			throw new Error(`Invalid Google tag row ${index + 1}`);
		}
		const [family, coordinates, sourceTag, sourceScore] = row;
		if (!family || coordinates === undefined || !sourceTag || !sourceScore) {
			throw new Error(`Incomplete Google tag row ${index + 1}`);
		}
		const score = Number(sourceScore);
		if (!Number.isFinite(score) || score < 0 || score > 100) {
			throw new Error(`Invalid Google tag score on row ${index + 1}`);
		}
		if (coordinates || score < MIN_GOOGLE_TAG_SCORE) continue;

		const tag = normalizeGoogleTag(sourceTag);
		if (tag.startsWith('quality/') || IGNORED_GOOGLE_TAGS.has(tag)) continue;
		if (!taxonomy.tags[tag]) {
			throw new Error(`Unknown canonical tag for Google ${sourceTag}`);
		}
		const tags = tagsByFamily.get(family) ?? new Set<string>();
		tags.add(tag);
		tagsByFamily.set(family, tags);
	}
	return new Map(
		[...tagsByFamily].map(([family, tags]) => [
			family,
			[...tags].toSorted(compareStrings),
		]),
	);
};

const LICENSES: Record<
	string,
	{ id: string; url: string; filenames: string[] }
> = {
	APACHE2: {
		id: 'Apache-2.0',
		url: 'https://www.apache.org/licenses/LICENSE-2.0',
		filenames: ['LICENSE.txt'],
	},
	OFL: {
		id: 'OFL-1.1',
		url: 'https://openfontlicense.org/open-font-license-official-text/',
		filenames: ['OFL.txt'],
	},
	UFL: {
		id: 'UFL-1.0',
		url: 'https://ubuntu.com/legal/font-licence',
		filenames: ['UFL.txt', 'LICENCE.txt'],
	},
};

const DOCUMENTS = [
	['DESCRIPTION.en_us.html', 'description.en-US.md'],
	['article/ARTICLE.en_us.html', 'article.en-US.md'],
] as const;

const turndown = new TurndownService({
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	headingStyle: 'atx',
});
turndown.remove([
	'script',
	'style',
	'iframe',
	'object',
	'embed',
	'img',
	'video',
	'audio',
	'source',
	'form',
	'input',
	'button',
	'svg',
	'canvas',
] as TurndownService.Filter);
turndown.addRule('safe-links', {
	filter: 'a',
	replacement: (content, node) => {
		const href = node.getAttribute('href');
		if (!href) return content;
		const url = URL.parse(href);
		return url?.protocol === 'http:' || url?.protocol === 'https:'
			? `[${content}](${url.toString()})`
			: content;
	},
});

const htmlToMarkdown = (html: string): string =>
	normalizeText(turndown.turndown(html));

type GoogleFamilyDirectory = {
	directory: string;
	family: GoogleFamily;
	files: ReadonlySet<string>;
};

const readGoogleFamilies = (
	snapshot: GitSnapshot,
): Map<string, GoogleFamilyDirectory> => {
	const filesByDirectory = new Map<string, Set<string>>();
	for (const path of snapshot.paths) {
		const match = path.match(/^(ofl|apache|ufl)\/([^/]+)\//);
		if (!match?.[2]) continue;
		const directory = `${match[1]}/${match[2]}`;
		const files = filesByDirectory.get(directory) ?? new Set<string>();
		files.add(path);
		filesByDirectory.set(directory, files);
	}

	const families = new Map<string, GoogleFamilyDirectory>();
	for (const [directory, files] of filesByDirectory) {
		if (directory.endsWith('_todelist')) continue;
		const path = `${directory}/METADATA.pb`;
		if (!files.has(path)) continue;
		const family = parseGoogleFamily(snapshot.read(path).toString('utf8'));
		const id = family.name.toLowerCase().replace(/\s+/g, '-');
		const previous = families.get(id);
		if (previous && previous.directory !== directory) {
			throw new Error(
				`Duplicate normalized family ID ${id}: ${previous.directory} and ${directory}`,
			);
		}
		families.set(id, { directory, family, files });
	}
	return families;
};

const writeAxisRegistry = async (
	snapshot: GitSnapshot,
	root: string,
): Promise<void> => {
	const axisPaths = snapshot.paths.filter((path) =>
		/^axisregistry\/Lib\/axisregistry\/data\/[^/]+\.textproto$/.test(path),
	);
	if (axisPaths.length === 0)
		throw new Error('No Google axis registry files found');
	const registry: Record<string, unknown> = {};
	for (const path of axisPaths) {
		const axis = parseProto<GoogleAxisProto>(
			axisProto,
			snapshot.read(path).toString('utf8'),
		);
		const tag = axis.tag ?? '';
		registry[tag] = {
			name: axis.display_name,
			description: axis.description,
			min: axis.min_value,
			max: axis.max_value,
			default: axis.default_value,
			precision: axis.precision,
		};
	}
	await writeJson(join(root, 'axes.json'), axisRegistrySchema.parse(registry));
};

const inspectFamilySources = async (
	snapshot: GitSnapshot,
	id: string,
	source: GoogleFamilyDirectory,
	ctx: ReturnType<typeof createFontContext>,
	matchLanguages: ReturnType<typeof createLanguageMatcher>,
): Promise<{
	sourceFiles: FamilyMetadata['sourceFiles'];
	inspectionFiles: FamilyInspection['files'];
	languages: string[];
}> => {
	const { directory, family, files } = source;
	const sourcePaths = new Set<string>();
	const declaredVariants = new Map<string, GoogleFont>();

	for (const font of family.fonts) {
		if (basename(font.filename) !== font.filename) {
			throw new Error(`${id} declares non-root font path ${font.filename}`);
		}
		const path = `${directory}/${font.filename}`;
		if (!files.has(path)) {
			throw new Error(`${id} is missing declared source ${path}`);
		}
		sourcePaths.add(path);
		declaredVariants.set(path, font);
	}

	for (const path of files) {
		if (path.startsWith(`${directory}/static/`) && path.endsWith('.ttf')) {
			sourcePaths.add(path);
		}
	}

	const sourceFiles: FamilyMetadata['sourceFiles'] = [];
	const inspectionFiles: FamilyInspection['files'] = [];
	const coverage: FontCoverage[] = [];

	// Keep inspection sequential: a single source face can already be memory-heavy.
	for (const path of Array.from(sourcePaths).toSorted(compareStrings)) {
		const contents = snapshot.read(path);
		const declared = declaredVariants.get(path);
		const inspected = await inspectFont(ctx, new Uint8Array(contents));
		const normalized = normalizeInspection(path, inspected);
		sourceFiles.push({
			path,
			sha256: sha256(contents),
			size: contents.byteLength,
			...(declared
				? { variant: { weight: declared.weight, style: declared.style } }
				: {}),
		});
		inspectionFiles.push(normalized);
		coverage.push({
			cmapSha256: normalized.cmap.sha256,
			unicodeRanges: inspected.unicodeRanges,
		});
	}

	return {
		sourceFiles,
		inspectionFiles,
		languages:
			family.languages.length > 0
				? [...family.languages].toSorted(compareStrings)
				: matchLanguages(coverage),
	};
};

const writeFamily = async (
	snapshot: GitSnapshot,
	id: string,
	source: GoogleFamilyDirectory,
	root: string,
	ctx: ReturnType<typeof createFontContext>,
	tags: readonly string[],
	languageCatalog: LanguageCatalog,
	matchLanguages: ReturnType<typeof createLanguageMatcher>,
): Promise<void> => {
	const { directory, family: google, files } = source;
	const license = LICENSES[google.license];
	if (!license)
		throw new Error(`${id} has unsupported license ${google.license}`);
	const licensePath = license.filenames
		.map((filename) => `${directory}/${filename}`)
		.find((path) => files.has(path));

	const {
		sourceFiles,
		inspectionFiles,
		languages: detectedLanguages,
	} = await inspectFamilySources(snapshot, id, source, ctx, matchLanguages);
	const languages = new Set(
		detectedLanguages.filter((language) => languageCatalog[language]),
	);
	if (google.primaryLanguage && languageCatalog[google.primaryLanguage]) {
		languages.add(google.primaryLanguage);
	}

	const copyrights = Array.from(
		new Set(
			google.fonts
				.map((font) => font.copyright?.trim())
				.filter((value): value is string => Boolean(value)),
		),
	).toSorted(compareStrings);
	const lastChanged = snapshot.lastChanged(directory);
	const metadata = familyMetadataSchema.parse({
		id,
		family: google.name,
		provider: 'google',
		status: 'active',
		provenance: {
			type: 'github',
			repository: 'google/fonts',
			revision: lastChanged.revision,
			directory,
		},
		...(google.displayName && google.displayName !== google.name
			? { displayName: google.displayName }
			: {}),
		classifications: normalizeGoogleClassifications(google),
		tags,
		languages: [...languages].toSorted(compareStrings),
		...(google.primaryLanguage && languageCatalog[google.primaryLanguage]
			? { primaryLanguage: google.primaryLanguage }
			: {}),
		...(google.primaryScript ? { primaryScript: google.primaryScript } : {}),
		...(google.sampleText ? { sampleText: google.sampleText } : {}),
		designer: google.designer,
		dateAdded: google.dateAdded,
		sourceModified: lastChanged.date,
		license: {
			id: license.id,
			url: license.url,
			...(copyrights.length > 0 ? { attribution: copyrights.join('\n') } : {}),
		},
		...(google.project ? { project: google.project } : {}),
		declaredSubsets: Array.from(new Set(google.subsets)).toSorted(
			compareStrings,
		),
		sourceFiles,
	});
	const inspection = familyInspectionSchema.parse({
		files: inspectionFiles,
	});
	const output = join(root, 'families', 'google', id);
	await mkdir(output, { recursive: true });
	await writeJson(join(output, 'metadata.json'), metadata);
	await writeJson(join(output, 'inspection.json'), inspection);
	if (licensePath) {
		await writeFile(
			join(output, 'license.txt'),
			normalizeText(snapshot.read(licensePath).toString('utf8')),
		);
	} else {
		await rm(join(output, 'license.txt'), { force: true });
	}

	for (const [sourcePath, outputName] of DOCUMENTS) {
		const path = `${directory}/${sourcePath}`;
		if (files.has(path)) {
			await writeFile(
				join(output, outputName),
				htmlToMarkdown(snapshot.read(path).toString('utf8')),
			);
		} else {
			await rm(join(output, outputName), { force: true });
		}
	}
};

export const generateGoogle = async (
	snapshot: GitSnapshot,
	root: string,
	previousFamilyIds: readonly string[],
	taxonomy: Taxonomy,
): Promise<string[]> => {
	const families = readGoogleFamilies(snapshot);
	const tagsByFamily = readGoogleTags(snapshot, taxonomy);
	const languageCatalog = readGoogleLanguages(snapshot);
	const referencedLanguages = new Set(
		[...families.values()].flatMap(({ family }) => [
			...family.languages,
			...(family.primaryLanguage ? [family.primaryLanguage] : []),
		]),
	);
	const unknownLanguages = [...referencedLanguages]
		.filter((language) => !languageCatalog[language])
		.toSorted(compareStrings);
	if (unknownLanguages.length > 0) {
		logger.warn(
			`Ignoring ${unknownLanguages.length} stale Google language references: ${unknownLanguages.join(', ')}`,
		);
	}
	await writeJson(join(root, 'languages.json'), languageCatalog);

	const familyIds = new Set(previousFamilyIds);
	const ctx = createFontContext();
	const matchLanguages = createLanguageMatcher(languageCatalog);
	const sortedFamilies = Array.from(families).toSorted(([left], [right]) =>
		compareStrings(left, right),
	);

	try {
		for (const [index, [id, family]] of sortedFamilies.entries()) {
			await writeFamily(
				snapshot,
				id,
				family,
				root,
				ctx,
				tagsByFamily.get(family.family.name) ?? [],
				languageCatalog,
				matchLanguages,
			);
			familyIds.add(id);
			const processed = index + 1;
			if (processed % 100 === 0 && processed < sortedFamilies.length) {
				logger.info(
					`Processed ${processed}/${sortedFamilies.length} font families`,
				);
			}
		}
	} finally {
		ctx.destroy();
	}

	for (const id of previousFamilyIds) {
		if (families.has(id)) continue;
		const metadataPath = join(root, 'families', 'google', id, 'metadata.json');
		const metadata = familyMetadataSchema.parse(await readJson(metadataPath));
		await writeJson(metadataPath, { ...metadata, status: 'deprecated' });
	}

	await writeAxisRegistry(snapshot, root);
	return Array.from(familyIds).toSorted(compareStrings);
};
