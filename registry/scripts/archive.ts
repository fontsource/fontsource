import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { consola } from 'consola';
import fastq from 'fastq';
import {
	RegistryAxesSchema,
	RegistryFamiliesSchema,
	RegistryFamilyDetailSchema,
	RegistryInfoSchema,
	RegistryLanguageSchema,
	RegistryLanguagesSchema,
	RegistrySubsetSchema,
	RegistrySubsetsSchema,
	RegistryTaxonomySchema,
} from '../../api/shared/registry.ts';
import { assertGitPathClean, getGitRevision } from './git.ts';
import { putCurrentObject, putObject } from './r2.ts';
import {
	archiveManifestSchema,
	axisRegistrySchema,
	familyInspectionSchema,
	familyMetadataSchema,
	languageCatalogSchema,
	registryIndexSchema,
	subsetDefinitionSchema,
	taxonomySchema,
} from './schema.ts';
import { canonicalJson, compareStrings, readJson, sha256 } from './shared.ts';
import { listFiles, validateRegistry } from './validator.ts';

const CONCURRENCY = 16;
const REPOSITORY_ROOT = resolve(import.meta.dirname, '../..');
const REGISTRY_ROOT = join(REPOSITORY_ROOT, 'registry', 'data');
const logger = consola.withTag('registry');

interface ArchiveFile {
	path: string;
	bytes: Uint8Array;
	size: number;
	sha256: string;
}

interface SourceFile {
	size: number;
	sha256: string;
	contentType: 'font/ttf' | 'font/otf';
	read?: () => Promise<Uint8Array>;
}

const createJsonFile = (path: string, value: unknown): ArchiveFile => {
	const bytes = Buffer.from(canonicalJson(value));
	return { path, bytes, size: bytes.byteLength, sha256: sha256(bytes) };
};

const readTextIfExists = async (path: string): Promise<string | undefined> => {
	try {
		return await readFile(path, 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
};

const createArchivePlan = async (root: string, registryRevision: string) => {
	await validateRegistry(root);

	const registry = await Promise.all(
		(await listFiles(root)).map(async (path): Promise<ArchiveFile> => {
			const bytes = await readFile(join(root, path));
			return { path, bytes, size: bytes.byteLength, sha256: sha256(bytes) };
		}),
	);
	const index = registryIndexSchema.parse(
		await readJson(join(root, 'index.json')),
	);
	const languages = languageCatalogSchema.parse(
		await readJson(join(root, 'languages.json')),
	);
	const languageSummaries = Object.entries(languages)
		.map(([id, language]) => ({
			id,
			language: language.language,
			script: language.script,
			name: language.name,
			preferredName: language.preferredName,
			autonym: language.autonym,
		}))
		.toSorted((left, right) => compareStrings(left.id, right.id));
	const languageViews = Object.entries(languages).map(([id, language]) =>
		createJsonFile(
			`languages/${id}.json`,
			RegistryLanguageSchema.parse({ id, ...language }),
		),
	);
	const sourceMap = new Map<string, SourceFile>();
	const familySummaries = [];
	const familyViews: ArchiveFile[] = [];
	for (const family of index.families) {
		const directory = join(root, 'families', family);
		const metadata = familyMetadataSchema.parse(
			await readJson(join(directory, 'metadata.json')),
		);
		const inspection = familyInspectionSchema.parse(
			await readJson(join(directory, 'inspection.json')),
		);
		const axes = [
			...new Set(
				inspection.files.flatMap((file) => file.axes.map(({ tag }) => tag)),
			),
		].toSorted(compareStrings);
		// Registry validation guarantees matching source and inspection order.
		const sources = metadata.sourceFiles.map((source, index) => {
			const inspected = inspection.files[index];
			const format = source.path.toLowerCase().endsWith('.otf') ? 'otf' : 'ttf';
			return {
				sha256: source.sha256,
				filename: basename(source.path),
				format,
				size: source.size,
				downloadUrl: `/v1/registry/sources/${source.sha256}`,
				type: inspected.axes.length > 0 ? 'variable' : 'static',
				fontVersion: inspected.fontVersion,
				weight: inspected.weight,
				style: inspected.style,
				axes: inspected.axes,
			};
		});
		const [description, article, licenseText] = await Promise.all([
			readTextIfExists(join(directory, 'description.en-US.md')),
			readTextIfExists(join(directory, 'article.en-US.md')),
			readTextIfExists(join(directory, 'license.txt')),
		]);
		const publicFamily = {
			id: metadata.id,
			family: metadata.family,
			...(metadata.displayName ? { displayName: metadata.displayName } : {}),
			provider: metadata.provider,
			status: metadata.status,
			classifications: metadata.classifications,
			tags: metadata.tags,
			languages: metadata.languages,
			sourceModified: metadata.sourceModified,
			declaredSubsets: metadata.declaredSubsets,
		};
		familySummaries.push({
			...publicFamily,
			variable: axes.length > 0,
			axes,
		});
		familyViews.push(
			createJsonFile(
				`families/${metadata.id}.json`,
				RegistryFamilyDetailSchema.parse({
					...publicFamily,
					primaryLanguage: metadata.primaryLanguage,
					primaryScript: metadata.primaryScript,
					sampleText: metadata.sampleText,
					designer: metadata.designer,
					dateAdded: metadata.dateAdded,
					license: {
						id: metadata.license.id,
						url: metadata.license.url,
						attribution: metadata.license.attribution,
						text: licenseText,
					},
					project: metadata.project
						? {
								repository: metadata.project.repository,
								revision: metadata.project.revision,
							}
						: undefined,
					content:
						description || article
							? {
									'en-US': {
										description,
										article,
									},
								}
							: undefined,
					sources,
				}),
			),
		);
		for (const source of metadata.sourceFiles) {
			let read: SourceFile['read'];
			if (metadata.provenance.type === 'github') {
				const { repository, revision } = metadata.provenance;
				read = () => readSource(source.path, repository, revision);
			}
			const previous = sourceMap.get(source.sha256);
			const contentType = source.path.toLowerCase().endsWith('.otf')
				? 'font/otf'
				: 'font/ttf';
			if (previous && previous.contentType !== contentType) {
				throw new Error(
					`Source ${source.sha256} is declared as both TTF and OTF`,
				);
			}
			sourceMap.set(source.sha256, {
				size: source.size,
				sha256: source.sha256,
				contentType,
				read: read ?? previous?.read,
			});
		}
	}
	const sources = [...sourceMap.values()].toSorted((left, right) =>
		compareStrings(left.sha256, right.sha256),
	);
	const subsets = await Promise.all(
		index.subsets.map(async (id) => {
			const subset = subsetDefinitionSchema.parse(
				await readJson(join(root, 'subsets', `${id}.json`)),
			);
			return createJsonFile(
				`subsets/${id}.json`,
				RegistrySubsetSchema.parse({
					id: subset.id,
					ranges: subset.ranges,
					slices: subset.slices?.map((slice) => ({
						id: slice.id,
						ranges: slice.ranges,
					})),
				}),
			);
		}),
	);
	const axes = axisRegistrySchema.parse(
		await readJson(join(root, 'axes.json')),
	);
	const taxonomy = taxonomySchema.parse(
		await readJson(join(root, 'taxonomy.json')),
	);
	const views = [
		createJsonFile(
			'registry.json',
			RegistryInfoSchema.parse({
				familyCount: familySummaries.length,
				languageCount: languageSummaries.length,
				subsetCount: index.subsets.length,
			}),
		),
		createJsonFile(
			'families.json',
			RegistryFamiliesSchema.parse({ families: familySummaries }),
		),
		createJsonFile(
			'subsets.json',
			RegistrySubsetsSchema.parse({ subsets: index.subsets }),
		),
		createJsonFile(
			'languages.json',
			RegistryLanguagesSchema.parse({ languages: languageSummaries }),
		),
		createJsonFile('axes.json', RegistryAxesSchema.parse({ axes })),
		createJsonFile('taxonomy.json', RegistryTaxonomySchema.parse(taxonomy)),
		...familyViews,
		...languageViews,
		...subsets,
	].toSorted((left, right) => compareStrings(left.path, right.path));

	return {
		registry,
		views,
		sources,
		manifest: archiveManifestSchema.parse({
			schemaVersion: 1,
			registryRevision,
			registry: registry.map(({ path, size, sha256: hash }) => ({
				path,
				size,
				sha256: hash,
			})),
			views: views.map(({ path, size, sha256: hash }) => ({
				path,
				size,
				sha256: hash,
			})),
			sources: sources.map((source) => ({
				size: source.size,
				sha256: source.sha256,
			})),
		}),
	};
};

const readSource = async (
	path: string,
	repository: string,
	revision: string,
): Promise<Uint8Array> => {
	// Some source fonts exceed jsDelivr's per-file limit, so read the pinned
	// GitHub object directly and let the registry hash verify the response.
	const encodedPath = path.split('/').map(encodeURIComponent).join('/');
	const response = await fetch(
		`https://raw.githubusercontent.com/${repository}/${revision}/${encodedPath}`,
	);
	if (!response.ok) {
		throw new Error(
			`Unable to fetch ${path}: ${response.status} ${response.statusText}`,
		);
	}
	return response.bytes();
};

export const publishArchive = async (
	root: string,
	registryRevision: string,
): Promise<void> => {
	logger.start(`Planning snapshot ${registryRevision}`);
	const plan = await createArchivePlan(root, registryRevision);
	logger.success(
		`Planned ${plan.registry.length} registry files, ${plan.views.length} API views, and ${plan.sources.length} source fonts`,
	);
	const manifestBytes = Buffer.from(canonicalJson(plan.manifest));
	const manifestKey = `snapshots/${registryRevision}/manifest.json`;
	const manifestHash = sha256(manifestBytes);

	const registryObjects = [
		...new Map(plan.registry.map((file) => [file.sha256, file])).values(),
	];
	const objects = [
		...registryObjects.map((file) => ({
			key: `registry/sha256/${file.sha256}`,
			size: file.size,
			sha256: file.sha256,
			read: async () => file.bytes,
		})),
		...plan.views.map((file) => ({
			key: `snapshots/${registryRevision}/api/${file.path}`,
			size: file.size,
			sha256: file.sha256,
			read: async () => file.bytes,
		})),
		...plan.sources.map((source) => ({
			key: `sources/sha256/${source.sha256}`,
			size: source.size,
			sha256: source.sha256,
			contentType: source.contentType,
			...(source.read ? { read: source.read } : {}),
		})),
	];
	logger.start(`Processing ${objects.length} archive objects`);
	const uploads = fastq.promise(putObject, CONCURRENCY);
	let processed = 0;
	await Promise.all(
		objects.map(async (object) => {
			await uploads.push(object);
			processed += 1;
			if (processed % 500 === 0 && processed < objects.length) {
				logger.info(`Processed ${processed}/${objects.length} archive objects`);
			}
		}),
	);
	logger.success(`Processed ${objects.length} archive objects`);
	logger.start('Publishing snapshot manifest');
	await putObject({
		key: manifestKey,
		size: manifestBytes.byteLength,
		sha256: manifestHash,
		read: async () => manifestBytes,
	});
	await putCurrentObject(
		Buffer.from(canonicalJson({ schemaVersion: 1, registryRevision })),
	);

	logger.success(
		`Archived snapshot ${registryRevision} with ${plan.registry.length} registry files, ${plan.views.length} API views, and ${plan.sources.length} source fonts`,
	);
};

if (import.meta.main) {
	assertGitPathClean(REPOSITORY_ROOT, 'registry/data');
	const revision = getGitRevision(REPOSITORY_ROOT);
	await publishArchive(REGISTRY_ROOT, revision);
}
