import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { consola } from 'consola';
import fastq from 'fastq';
import {
	RegistryAxesSchema,
	RegistryFamiliesSchema,
	RegistryFamilyDetailSchema,
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
	familySchema,
	languageCatalogSchema,
	replacementRegistrySchema,
	subsetDefinitionSchema,
	taxonomySchema,
} from './schema.ts';
import { canonicalJson, compareStrings, readJson, sha256 } from './shared.ts';
import {
	listFamilyKeys,
	listFiles,
	listSubsetIds,
	validateRegistry,
} from './validator.ts';

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
	const familyKeys = await listFamilyKeys(root);
	const subsetIds = await listSubsetIds(root);
	const replacements = replacementRegistrySchema.parse(
		await readJson(join(root, 'replacements.json')),
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
			sampleText: language.sampleText,
		}))
		.toSorted((left, right) => compareStrings(left.id, right.id));
	const sourceMap = new Map<string, SourceFile>();
	const familySummaries = [];
	const familyViews: ArchiveFile[] = [];
	for (const familyKey of familyKeys) {
		const [provider, id] = familyKey.split('/') as [string, string];
		const directory = join(root, 'families', familyKey);
		const family = familySchema.parse(
			await readJson(join(directory, 'family.json')),
		);
		const axes = [
			...new Set(
				family.sources.flatMap(({ inspection }) =>
					inspection.axes.map(({ tag }) => tag),
				),
			),
		].toSorted(compareStrings);
		const sources = family.sources.map((source) => {
			const variable = source.inspection.axes.length > 0;
			const format = source.path.toLowerCase().endsWith('.otf') ? 'otf' : 'ttf';
			const common = {
				sha256: source.sha256,
				filename: basename(source.path),
				format,
				size: source.size,
				downloadUrl: `/v1/registry/sources/${source.sha256}`,
				fontVersion: source.inspection.fontVersion,
				style: source.inspection.style,
				declaredVariant: source.variant,
			};
			if (variable) {
				return {
					...common,
					type: 'variable' as const,
					weight: source.inspection.weight,
					axes: source.inspection.axes,
				};
			}
			const weight = source.inspection.weight;
			if (typeof weight !== 'number') {
				throw new Error(`Static source ${source.path} has a weight range`);
			}
			return { ...common, type: 'static' as const, weight };
		});
		const [description, article, licenseText] = await Promise.all([
			readTextIfExists(join(directory, 'description.en-US.md')),
			readTextIfExists(join(directory, 'article.en-US.md')),
			readTextIfExists(join(directory, 'license.txt')),
		]);
		const publicFamily = {
			id,
			family: family.family,
			...(family.displayName ? { displayName: family.displayName } : {}),
			provider,
			status: family.status,
			replacedBy: replacements[id],
			classifications: family.classifications,
			tags: family.tags,
			sourceModified: family.sourceModified,
			axes,
		};
		familySummaries.push(publicFamily);
		familyViews.push(
			createJsonFile(
				`families/${id}.json`,
				RegistryFamilyDetailSchema.parse({
					...publicFamily,
					languages: family.languages,
					primaryLanguage: family.primaryLanguage,
					primaryScript: family.primaryScript,
					sampleText: family.sampleText,
					designer: family.designer,
					dateAdded: family.dateAdded,
					license: {
						id: family.license.id,
						url: family.license.url,
						attribution: family.license.attribution,
						text: licenseText,
					},
					project: family.project
						? {
								repository: family.project.repository,
								revision: family.project.revision,
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
		for (const source of family.sources) {
			let read: SourceFile['read'];
			if (family.provenance.type === 'github') {
				const { repository, revision } = family.provenance;
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
		subsetIds.map(async (id) => {
			const subset = subsetDefinitionSchema.parse(
				await readJson(join(root, 'subsets', `${id}.json`)),
			);
			return createJsonFile(
				`subsets/${id}.json`,
				RegistrySubsetSchema.parse({
					id,
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
			'families.json',
			RegistryFamiliesSchema.parse(familySummaries),
		),
		createJsonFile('subsets.json', RegistrySubsetsSchema.parse(subsetIds)),
		createJsonFile(
			'languages.json',
			RegistryLanguagesSchema.parse(languageSummaries),
		),
		createJsonFile('axes.json', RegistryAxesSchema.parse(axes)),
		createJsonFile('taxonomy.json', RegistryTaxonomySchema.parse(taxonomy)),
		...familyViews,
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
