import { deepStrictEqual } from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createFontContext, inspectFont } from '@fontsource-utils/core';
import { consola } from 'consola';
import type { GitSnapshot } from './git.ts';
import { normalizeInspection } from './inspection.ts';
import { createLanguageMatcher, type FontCoverage } from './languages.ts';
import {
	type Family,
	familySchema,
	type LanguageCatalog,
	type SourceFamily,
	sourceFamilySchema,
} from './schema.ts';
import {
	compareStrings,
	normalizeText,
	readJson,
	sha256,
	writeJson,
} from './shared.ts';

const FONT_FILES_REPOSITORY = 'fontsource/font-files';
const logger = consola.withTag('registry');

const DOCUMENTS = ['article.en-US.md', 'description.en-US.md'] as const;

type FontFilesFamily = {
	directory: string;
	files: ReadonlySet<string>;
	metadata: SourceFamily;
};

const readFamilies = (snapshot: GitSnapshot): FontFilesFamily[] => {
	const filesByDirectory = new Map<string, Set<string>>();
	for (const path of snapshot.paths) {
		const match = path.match(/^sources\/([^/]+)\//);
		if (!match?.[1]) continue;
		const directory = `sources/${match[1]}`;
		const files = filesByDirectory.get(directory) ?? new Set<string>();
		files.add(path);
		filesByDirectory.set(directory, files);
	}

	const families: FontFilesFamily[] = [];
	for (const [directory, files] of filesByDirectory) {
		const metadataPath = `${directory}/metadata.json`;
		if (!files.has(metadataPath)) {
			throw new Error(`${directory} is missing metadata.json`);
		}
		const metadata = sourceFamilySchema.parse(
			JSON.parse(snapshot.read(metadataPath).toString('utf8')),
		);
		const id = directory.slice('sources/'.length);
		if (metadata.id !== id) {
			throw new Error(`${directory} metadata ID must be ${id}`);
		}
		families.push({ directory, files, metadata });
	}
	return families.toSorted((left, right) =>
		compareStrings(left.metadata.id, right.metadata.id),
	);
};

const writeFamily = async (
	snapshot: GitSnapshot,
	source: FontFilesFamily,
	root: string,
	ctx: ReturnType<typeof createFontContext>,
	matchLanguages: ReturnType<typeof createLanguageMatcher>,
): Promise<void> => {
	const { directory, files, metadata: sourceMetadata } = source;
	const { sourceFiles: declaredSourceFiles, ...sourceMetadataWithoutFiles } =
		sourceMetadata;
	const licensePath = `${directory}/license.txt`;
	if (!files.has(licensePath)) {
		throw new Error(`${directory} is missing license.txt`);
	}
	const declaredFiles = declaredSourceFiles.map((file) => ({
		...file,
		path: `${directory}/${file.path}`,
	}));
	const actualPaths = Array.from(files)
		.filter((path) => path.startsWith(`${directory}/files/`))
		.toSorted(compareStrings);
	for (const path of actualPaths) {
		if (!/\.(?:otf|ttf)$/i.test(path)) {
			throw new Error(`${path} must be a TTF or OTF source`);
		}
	}
	deepStrictEqual(
		declaredFiles.map((file) => file.path).toSorted(compareStrings),
		actualPaths,
		`${sourceMetadata.id} metadata must declare every source file`,
	);

	const sources: Family['sources'] = [];
	const coverage: FontCoverage[] = [];
	for (const sourceFile of declaredFiles.toSorted((left, right) =>
		compareStrings(left.path, right.path),
	)) {
		const contents = snapshot.read(sourceFile.path);
		const inspected = await inspectFont(ctx, new Uint8Array(contents));
		sources.push({
			path: sourceFile.path,
			sha256: sha256(contents),
			size: contents.byteLength,
			variant: sourceFile.variant,
			inspection: normalizeInspection(inspected),
		});
		coverage.push(inspected.unicodeRanges);
	}
	const lastChanged = snapshot.lastChanged(directory);
	const languages = new Set(
		sourceMetadata.languages ?? matchLanguages(coverage),
	);
	if (
		sourceMetadata.languages === undefined &&
		sourceMetadata.primaryLanguage
	) {
		languages.add(sourceMetadata.primaryLanguage);
	}
	const { id, primaryLanguage, ...sourceFields } = sourceMetadataWithoutFiles;
	const family = familySchema.parse({
		...sourceFields,
		primaryLanguage: languages.has(primaryLanguage ?? '')
			? primaryLanguage
			: undefined,
		status: 'active',
		provenance: {
			type: 'github',
			repository: FONT_FILES_REPOSITORY,
			revision: lastChanged.revision,
			directory,
		},
		sourceModified: lastChanged.date,
		classifications: Array.from(
			new Set(sourceMetadata.classifications),
		).toSorted(compareStrings),
		tags: Array.from(new Set(sourceMetadata.tags)).toSorted(compareStrings),
		languages: [...languages].toSorted(compareStrings),
		sources,
	});
	const output = join(root, 'families', 'fontsource', id);
	await mkdir(output, { recursive: true });
	await writeJson(join(output, 'family.json'), family);

	await writeFile(
		join(output, 'license.txt'),
		normalizeText(snapshot.read(licensePath).toString('utf8')),
	);
	for (const document of DOCUMENTS) {
		const path = `${directory}/${document}`;
		if (files.has(path)) {
			await writeFile(
				join(output, document),
				normalizeText(snapshot.read(path).toString('utf8')),
			);
		} else {
			await rm(join(output, document), { force: true });
		}
	}
};

export const generateFontFiles = async (
	snapshot: GitSnapshot,
	root: string,
	previousFamilyIds: readonly string[],
	languages: LanguageCatalog,
): Promise<string[]> => {
	const families = readFamilies(snapshot);
	const familyIds = new Set(previousFamilyIds);
	const ctx = createFontContext();
	const matchLanguages = createLanguageMatcher(languages);
	try {
		for (const [index, family] of families.entries()) {
			await writeFamily(snapshot, family, root, ctx, matchLanguages);
			familyIds.add(family.metadata.id);
			const processed = index + 1;
			if (processed % 25 === 0 && processed < families.length) {
				logger.info(
					`Processed ${processed}/${families.length} Fontsource font families`,
				);
			}
		}
	} finally {
		ctx.destroy();
	}

	const currentIds = new Set(families.map((family) => family.metadata.id));
	for (const id of previousFamilyIds) {
		if (currentIds.has(id)) continue;
		const familyPath = join(root, 'families', 'fontsource', id, 'family.json');
		const family = familySchema.parse(await readJson(familyPath));
		await writeJson(familyPath, { ...family, status: 'deprecated' });
	}

	return [...familyIds].toSorted(compareStrings);
};
