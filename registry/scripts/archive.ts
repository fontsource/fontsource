import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { consola } from 'consola';
import fastq from 'fastq';
import { assertGitPathClean, getGitRevision } from './git.ts';
import { objectMatches, putObject } from './r2.ts';
import {
	archiveManifestSchema,
	familyMetadataSchema,
	registryIndexSchema,
} from './schema.ts';
import { canonicalJson, compareStrings, readJson, sha256 } from './shared.ts';
import { listFiles, validateRegistry } from './validator.ts';

const CONCURRENCY = 16;
const REPOSITORY_ROOT = resolve(import.meta.dirname, '../..');
const REGISTRY_ROOT = join(REPOSITORY_ROOT, 'registry', 'data');
const logger = consola.withTag('registry');

interface RegistryFile {
	path: string;
	bytes: Uint8Array;
	size: number;
	sha256: string;
}

interface SourceFile {
	path: string;
	repository: string;
	revision: string;
	size: number;
	sha256: string;
}

const createArchivePlan = async (root: string, registryRevision: string) => {
	await validateRegistry(root);

	const registry = await Promise.all(
		(await listFiles(root)).map(async (path): Promise<RegistryFile> => {
			const bytes = await readFile(join(root, path));
			return { path, bytes, size: bytes.byteLength, sha256: sha256(bytes) };
		}),
	);
	const index = registryIndexSchema.parse(
		await readJson(join(root, 'index.json')),
	);
	const sourceMap = new Map<string, SourceFile>();
	for (const family of index.families) {
		const metadata = familyMetadataSchema.parse(
			await readJson(join(root, 'families', family, 'metadata.json')),
		);
		for (const source of metadata.sourceFiles) {
			sourceMap.set(source.sha256, {
				path: source.path,
				repository: index.upstreams.googleFonts.repository,
				revision: metadata.origin.revision,
				size: source.size,
				sha256: source.sha256,
			});
		}
	}
	const sources = [...sourceMap.values()].toSorted((left, right) =>
		compareStrings(left.sha256, right.sha256),
	);

	return {
		registry,
		sources,
		manifest: archiveManifestSchema.parse({
			schemaVersion: 1,
			registryRevision,
			registry: registry.map(({ path, size, sha256: hash }) => ({
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

const readSource = async (source: SourceFile): Promise<Uint8Array> => {
	// Some source TTFs exceed jsDelivr's per-file limit, so read the pinned
	// GitHub object directly and let the registry hash verify the response.
	const path = source.path.split('/').map(encodeURIComponent).join('/');
	const response = await fetch(
		`https://raw.githubusercontent.com/${source.repository}/${source.revision}/${path}`,
	);
	if (!response.ok) {
		throw new Error(
			`Unable to fetch ${source.path}: ${response.status} ${response.statusText}`,
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
		`Planned ${plan.registry.length} registry files and ${plan.sources.length} source fonts`,
	);
	const manifestBytes = Buffer.from(canonicalJson(plan.manifest));
	const manifestKey = `snapshots/${registryRevision}/manifest.json`;
	const manifestHash = sha256(manifestBytes);
	if (
		await objectMatches(manifestKey, manifestBytes.byteLength, manifestHash)
	) {
		logger.success(`Snapshot ${registryRevision} is already archived`);
		return;
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
		...plan.sources.map((source) => ({
			key: `sources/sha256/${source.sha256}`,
			size: source.size,
			sha256: source.sha256,
			read: () => readSource(source),
		})),
	];
	logger.start(`Processing ${objects.length} content-addressed objects`);
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
	logger.success(`Processed ${objects.length} content-addressed objects`);
	logger.start('Publishing snapshot manifest');
	await putObject({
		key: manifestKey,
		size: manifestBytes.byteLength,
		sha256: manifestHash,
		read: async () => manifestBytes,
	});

	logger.success(
		`Archived snapshot ${registryRevision} with ${plan.registry.length} registry files and ${plan.sources.length} source fonts`,
	);
};

if (import.meta.main) {
	assertGitPathClean(REPOSITORY_ROOT, 'registry/data');
	const revision = getGitRevision(REPOSITORY_ROOT);
	await publishArchive(REGISTRY_ROOT, revision);
}
