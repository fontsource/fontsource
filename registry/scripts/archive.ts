import { readFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { consola } from 'consola';
import fastq from 'fastq';
import {
	RegistryAxesSchema,
	RegistryFamiliesSchema,
	RegistryFamilyDetailSchema,
	RegistryFamilySymbolsSchema,
	RegistryLanguagesSchema,
	RegistrySourceCapabilitiesSchema,
	RegistrySubsetSchema,
	RegistrySubsetsSchema,
	RegistryTaxonomySchema,
} from '../../api/shared/registry.ts';
import {
	CurrentRegistrySnapshotSchema,
	REGISTRY_SNAPSHOT_PREFIX,
} from '../../api/shared/registry-archive.ts';
import { writeSnapshot } from './archive-snapshot.ts';
import { assertGitPathClean, getGitRevision } from './git.ts';
import { getObject, putCurrentObject, putObject } from './r2.ts';
import {
	archiveManifestSchema,
	axisRegistrySchema,
	type FamilySource,
	familyDistributionSchema,
	familyIconsSchema,
	familySchema,
	familyTagsSchema,
	languageCatalogSchema,
	replacementRegistrySchema,
	subsetDefinitionSchema,
	taxonomySchema,
} from './schema.ts';
import {
	canonicalJson,
	compareStrings,
	readJson,
	readJsonIfExists,
	sha256,
} from './shared.ts';
import {
	listFamilyKeys,
	listFiles,
	listSubsetIds,
	resolveDistributionSources,
	validateRegistry,
} from './validator.ts';

// Keep concurrent retries within the S3 client's shared retry budget.
const CONCURRENCY = 8;
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
	capabilities: ReturnType<typeof sourceCapabilities>;
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

const sourceCapabilities = (source: FamilySource) =>
	RegistrySourceCapabilitiesSchema.parse({
		glyphCount: source.inspection.glyphs,
		codepointCount: source.inspection.codepoints,
		unicodeRange: source.inspection.unicodeRange,
		features: source.inspection.features,
		outline: source.inspection.outline,
		colorTables: source.inspection.colorTables,
	});

const selectPreviewSource = (
	distribution: ReturnType<typeof resolveDistributionSources>,
): string => {
	// Prefer the normal variable source that represents the package's standard
	// axes. It gives previews the broadest useful style range from one source.
	const variable =
		distribution.variable?.find(
			(variant) => variant.axisKey === 'standard' && variant.style === 'normal',
		) ??
		distribution.variable?.find((variant) => variant.style === 'normal') ??
		distribution.variable?.find((variant) => variant.axisKey === 'standard') ??
		distribution.variable?.[0];
	if (variable) return variable.source;

	const staticSource = distribution.static
		?.toSorted((left, right) => {
			const leftStyle = left.style === 'normal' ? 0 : 1;
			const rightStyle = right.style === 'normal' ? 0 : 1;
			return (
				leftStyle - rightStyle ||
				Math.abs(left.weight - 400) - Math.abs(right.weight - 400) ||
				right.weight - left.weight
			);
		})
		.at(0);
	if (staticSource) return staticSource.source;

	throw new Error('Registry distribution has no preview source');
};

const resolvePublicCharacterDistribution = (
	characters: ReturnType<typeof familyDistributionSchema.parse>['characters'],
) => {
	if (characters === 'all') return { type: 'all' } as const;

	const slicing = characters.slicing;
	if (!slicing) return { type: 'subsets', ...characters } as const;

	return {
		type: 'subsets',
		defaultSubset: characters.defaultSubset,
		subsets: characters.subsets,
		slicing: slicing.definition,
		slicingSubset: slicing.subset,
	} as const;
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
	const familyTags = familyTagsSchema.parse(
		await readJson(join(root, 'family-tags.json')),
	);
	const curatedTags = new Map<string, string[]>();
	for (const [tag, ids] of Object.entries(familyTags)) {
		for (const id of ids) {
			const tags = curatedTags.get(id) ?? [];
			tags.push(tag);
			curatedTags.set(id, tags);
		}
	}
	const languages = languageCatalogSchema.parse(
		await readJson(join(root, 'languages.json')),
	);
	const getLanguageDirection = (
		language: (typeof languages)[string],
	): 'ltr' | 'rtl' => {
		const locale = new Intl.Locale(`und-${language.script}`) as Intl.Locale & {
			getTextInfo: () => { direction: 'ltr' | 'rtl' };
		};
		return locale.getTextInfo().direction;
	};
	const languageSummaries = Object.entries(languages)
		.map(([id, language]) => ({
			id,
			language: language.language,
			script: language.script,
			direction: getLanguageDirection(language),
			name: language.name,
			preferredName: language.preferredName,
			autonym: language.autonym,
			sampleText: language.sampleText,
		}))
		.toSorted((left, right) => compareStrings(left.id, right.id));
	const sourceMap = new Map<string, SourceFile>();
	const familySummaries = [];
	const familyViews: ArchiveFile[] = [];
	const symbolViews: ArchiveFile[] = [];
	for (const familyKey of familyKeys) {
		const [provider, id] = familyKey.split('/') as [string, string];
		const directory = join(root, 'families', familyKey);
		const family = familySchema.parse(
			await readJson(join(directory, 'family.json')),
		);
		const iconsValue = await readJsonIfExists(join(directory, 'icons.json'));
		const icons = iconsValue ? familyIconsSchema.parse(iconsValue) : undefined;
		if (icons) {
			symbolViews.push(
				createJsonFile(
					`families/${id}/symbols.json`,
					RegistryFamilySymbolsSchema.parse(icons.icons),
				),
			);
		}
		const distribution = familyDistributionSchema.parse(
			await readJson(join(directory, 'distribution.json')),
		);
		const publicDistribution = {
			...resolveDistributionSources(distribution, family, id),
			characters: resolvePublicCharacterDistribution(distribution.characters),
		};
		const previewSource = selectPreviewSource(publicDistribution);
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
				path: source.path,
				format,
				size: source.size,
				downloadUrl: `/v1/registry/sources/${source.sha256}`,
				capabilitiesUrl: `/v1/registry/sources/${source.sha256}/capabilities`,
				fontVersion: source.inspection.fontVersion,
				glyphCount: source.inspection.glyphs,
				codepointCount: source.inspection.codepoints,
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
			readFile(join(directory, 'license.txt'), 'utf8'),
		]);
		const publicFamily = {
			id,
			family: family.family,
			displayName: family.displayName,
			provider,
			status: family.status,
			replacedBy: replacements[id],
			classifications: family.classifications,
			tags: Array.from(
				new Set([...family.tags, ...(curatedTags.get(id) ?? [])]),
			).toSorted(compareStrings),
			sourceModified: family.sourceModified,
			axes,
			primaryLanguage: family.primaryLanguage,
			primaryScript: family.primaryScript,
			primaryDirection: family.primaryLanguage
				? getLanguageDirection(languages[family.primaryLanguage])
				: undefined,
			previewSubset: family.previewSubset,
			sampleText: family.sampleText,
			previewContext: family.previewContext,
			designer: family.designer,
			license: {
				id: family.license.id,
				url: family.license.url,
			},
		};
		familySummaries.push(publicFamily);
		familyViews.push(
			createJsonFile(
				`families/${id}.json`,
				RegistryFamilyDetailSchema.parse({
					...publicFamily,
					languages: family.languages,
					dateAdded: family.dateAdded,
					license: {
						id: family.license.id,
						url: family.license.url,
						attribution: family.license.attribution,
						text: licenseText,
					},
					project: family.project,
					provenance:
						family.provenance.type === 'github'
							? {
									type: family.provenance.type,
									repository: `https://github.com/${family.provenance.repository}`,
									revision: family.provenance.revision,
								}
							: { type: family.provenance.type },
					content:
						description || article
							? {
									'en-US': {
										description,
										article,
									},
								}
							: undefined,
					symbols: icons
						? {
								catalogUrl: `/v1/registry/families/${id}/symbols`,
								inputModes: icons.inputModes,
							}
						: undefined,
					sources,
					previewSource,
					distribution: publicDistribution,
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
			const capabilities = sourceCapabilities(source);
			const contentType = source.path.toLowerCase().endsWith('.otf')
				? 'font/otf'
				: 'font/ttf';
			if (previous && previous.contentType !== contentType) {
				throw new Error(
					`Source ${source.sha256} is declared as both TTF and OTF`,
				);
			}
			if (
				previous &&
				canonicalJson(previous.capabilities) !== canonicalJson(capabilities)
			) {
				throw new Error(`Source ${source.sha256} has conflicting capabilities`);
			}
			sourceMap.set(source.sha256, {
				size: source.size,
				sha256: source.sha256,
				contentType,
				capabilities,
				read: read ?? previous?.read,
			});
		}
	}
	const sources = [...sourceMap.values()].toSorted((left, right) =>
		compareStrings(left.sha256, right.sha256),
	);
	const capabilityViews = sources.map((source) =>
		createJsonFile(
			`sources/${source.sha256}/capabilities.json`,
			source.capabilities,
		),
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
		...symbolViews,
		...capabilityViews,
		...subsets,
	].toSorted((left, right) => compareStrings(left.path, right.path));

	return {
		registry,
		views,
		sources,
		manifest: archiveManifestSchema.parse({
			schemaVersion: 2,
			registryRevision,
			registry: registry.map(({ path, size, sha256 }) => ({
				path,
				size,
				sha256,
			})),
			views: views.map(({ path, size, sha256 }) => ({
				path,
				size,
				sha256,
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
	const started = performance.now();
	logger.start(`Planning snapshot ${registryRevision}`);
	const plan = await createArchivePlan(root, registryRevision);
	logger.success(
		`Planned ${plan.registry.length} registry files, ${plan.views.length} API views, and ${plan.sources.length} source fonts`,
	);
	logger.info(
		`Plan completed in ${((performance.now() - started) / 1000).toFixed(1)}s`,
	);
	const currentBytes = await getObject('current.json');
	const known = new Map<string, number>();
	if (currentBytes) {
		const current = CurrentRegistrySnapshotSchema.parse(
			JSON.parse(Buffer.from(currentBytes).toString('utf8')),
		);
		const bytes = await getObject(
			`${REGISTRY_SNAPSHOT_PREFIX}/${current.registryRevision}/manifest.json`,
		);
		if (!bytes)
			throw new Error(
				'Current snapshot has not been migrated. Run archive:migrate before publishing.',
			);
		const previous = archiveManifestSchema.parse(
			JSON.parse(Buffer.from(bytes).toString('utf8')),
		);
		if (previous.registryRevision !== current.registryRevision)
			throw new Error('Current snapshot manifest revision does not match');
		// Published blobs are immutable. Reuse the successful manifest, not a bucket-wide scan.
		for (const [prefix, files] of [
			['registry', previous.registry],
			['api', previous.views],
			['sources', previous.sources],
		] as const) {
			for (const file of files)
				known.set(`${prefix}/sha256/${file.sha256}`, file.size);
		}
	}

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
		...[...new Map(plan.views.map((file) => [file.sha256, file])).values()].map(
			(file) => ({
				key: `api/sha256/${file.sha256}`,
				size: file.size,
				sha256: file.sha256,
				contentType: 'application/json',
				read: async () => file.bytes,
			}),
		),
		...plan.sources.map((source) => ({
			...source,
			key: `sources/sha256/${source.sha256}`,
		})),
	];
	const pending = objects.filter((object) => {
		const size = known.get(object.key);
		if (size !== undefined && size !== object.size)
			throw new Error(`Published object size does not match ${object.key}`);
		return size === undefined;
	});
	logger.start(
		`Reusing ${objects.length - pending.length} objects; checking ${pending.length} new objects`,
	);
	const uploadStarted = performance.now();
	const uploads = fastq.promise(putObject, CONCURRENCY);
	let processed = 0;
	let uploaded = 0;
	// Drain in-flight work before reporting failure, so retries cannot overlap a failed run.
	const results = await Promise.allSettled(
		pending.map(async (object) => {
			if (await uploads.push(object)) uploaded += 1;
			processed += 1;
			if (processed % 500 === 0 && processed < pending.length) {
				logger.info(`Processed ${processed}/${pending.length} archive objects`);
			}
		}),
	);
	const failure = results.find((result) => result.status === 'rejected');
	if (failure?.status === 'rejected') throw failure.reason;
	logger.success(
		`Uploaded ${uploaded}, already stored ${pending.length - uploaded} in ${((performance.now() - uploadStarted) / 1000).toFixed(1)}s`,
	);
	logger.start('Publishing snapshot index and manifest');
	await writeSnapshot(plan.manifest);
	await putCurrentObject(
		Buffer.from(canonicalJson({ schemaVersion: 1, registryRevision })),
	);

	logger.success(
		`Archived snapshot ${registryRevision} in ${((performance.now() - started) / 1000).toFixed(1)}s with ${plan.registry.length} registry files, ${plan.views.length} API views, and ${plan.sources.length} source fonts`,
	);
};

if (import.meta.main) {
	assertGitPathClean(REPOSITORY_ROOT, 'registry/data');
	const revision = getGitRevision(REPOSITORY_ROOT);
	await publishArchive(REGISTRY_ROOT, revision);
}
