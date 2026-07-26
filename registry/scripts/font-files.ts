import { deepStrictEqual } from 'node:assert/strict';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createFontContext, inspectFont } from '@fontsource-utils/core';
import type { GitSnapshot } from './git.ts';
import { normalizeInspection } from './inspection.ts';
import {
	type FamilyMetadata,
	familyInspectionSchema,
	familyMetadataSchema,
	type SourceFamily,
	sourceFamilySchema,
} from './schema.ts';
import { compareStrings, normalizeText, sha256, writeJson } from './shared.ts';

const FONT_FILES_REPOSITORY = 'fontsource/font-files';

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
): Promise<void> => {
	const { directory, files, metadata: sourceMetadata } = source;
	const licensePath = `${directory}/license.txt`;
	if (!files.has(licensePath)) {
		throw new Error(`${directory} is missing license.txt`);
	}
	const declaredFiles = sourceMetadata.sourceFiles.map((file) => ({
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

	const sourceFiles: FamilyMetadata['sourceFiles'] = [];
	const inspectionFiles: Array<ReturnType<typeof normalizeInspection>> = [];
	for (const sourceFile of declaredFiles.toSorted((left, right) =>
		compareStrings(left.path, right.path),
	)) {
		const contents = snapshot.read(sourceFile.path);
		sourceFiles.push({
			path: sourceFile.path,
			sha256: sha256(contents),
			size: contents.byteLength,
			...(sourceFile.variant ? { variant: sourceFile.variant } : {}),
		});
		inspectionFiles.push(
			normalizeInspection(
				sourceFile.path,
				await inspectFont(ctx, new Uint8Array(contents)),
			),
		);
	}
	const lastChanged = snapshot.lastChanged(directory);
	const metadata = familyMetadataSchema.parse({
		...sourceMetadata,
		provider: 'fontsource',
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
		declaredSubsets: Array.from(
			new Set(sourceMetadata.declaredSubsets),
		).toSorted(compareStrings),
		sourceFiles,
	});
	const inspection = familyInspectionSchema.parse({ files: inspectionFiles });
	const output = join(root, 'families', 'fontsource', metadata.id);
	await mkdir(output, { recursive: true });
	await writeJson(join(output, 'metadata.json'), metadata);
	await writeJson(join(output, 'inspection.json'), inspection);

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
): Promise<string[]> => {
	const families = readFamilies(snapshot);
	const ctx = createFontContext();
	try {
		for (const family of families) {
			await writeFamily(snapshot, family, root, ctx);
		}
	} finally {
		ctx.destroy();
	}
	return families.map((family) => family.metadata.id);
};
