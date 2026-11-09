import { createHash } from 'node:crypto';
import { glob, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { createFontContext } from '@fontsource-utils/core';
import { consola } from 'consola';
import {
	type PreparedArtifact,
	PreparedArtifactSchema,
	preparedArtifactPrefix,
	preparedArtifactUrl,
} from '../../api/shared/prepared-artifacts.ts';
import { RegistryFamiliesSchema } from '../../api/shared/registry.ts';
import { buildFamily } from './build/family.ts';
import { loadBuildInputs } from './build/inputs.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PROFILE = 'web-1';
const digest = (value: string | Uint8Array) =>
	createHash('sha256').update(value).digest('hex');
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

export interface ArtifactBuildOptions {
	inputs: string;
	out: string;
	registryUrl?: string;
	revision?: string;
	upload?: boolean;
}

// Include the actual processor and locked dependencies so a code-only update
// cannot accidentally reuse an older web build.
const processorIdentity = async () => {
	const processorFiles: string[] = [];
	for await (const path of glob('packages/core/dist/**/*.js', { cwd: ROOT }))
		processorFiles.push(path);
	if (!processorFiles.length)
		throw new Error('Build @fontsource-utils/core before preparing artifacts');
	const paths = [
		...processorFiles,
		'pnpm-lock.yaml',
		'api/shared/prepared-artifacts.ts',
		'api/shared/package-output.ts',
		'api/shared/registry.ts',
		'registry/scripts/build/family.ts',
		'registry/scripts/build-artifacts.ts',
	];
	const hash = createHash('sha256')
		.update(PROFILE)
		.update(process.versions.node);
	for (const path of paths.sort())
		hash.update(path).update(await readFile(join(ROOT, path)));
	return hash.digest('hex');
};

const readManifest = async (path: string) => {
	try {
		return PreparedArtifactSchema.parse(
			JSON.parse(await readFile(path, 'utf8')),
		);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
		throw error;
	}
};

export async function buildArtifacts(
	ids: string[],
	options: ArtifactBuildOptions,
): Promise<PreparedArtifact[]> {
	const registryUrl = options.registryUrl ?? 'https://api.fontsource.org';
	let revision = options.revision;
	if (!ids.length) {
		const url = new URL('/v1/registry/families', registryUrl);
		if (revision) url.searchParams.set('revision', revision);
		const response = await fetch(url);
		if (!response.ok) throw new Error(`Registry families: ${response.status}`);
		const resolved = response.headers.get('X-Registry-Revision');
		if (
			!resolved ||
			!/^[0-9a-f]{40}$/.test(resolved) ||
			(revision && resolved !== revision)
		)
			throw new Error('Missing or mismatched registry revision');
		revision = resolved;
		ids = RegistryFamiliesSchema.parse(await response.json()).map(
			(family) => family.id,
		);
	}
	const processor = await processorIdentity();
	const store = options.upload ? await createArtifactStore() : undefined;
	const context = createFontContext();
	const completed: PreparedArtifact[] = [];
	try {
		for (const id of [...new Set(ids)].sort()) {
			const inputDirectory = resolve(options.inputs, id);
			const inputs = await loadBuildInputs(
				[id],
				inputDirectory,
				registryUrl,
				revision,
			);
			// Pin subsequent families to the first resolved snapshot too.
			revision ??= JSON.parse(
				await readFile(join(inputDirectory, 'snapshot.json'), 'utf8'),
			).revision;
			const family = inputs.families[0];
			const artifact = digest(
				JSON.stringify({ processor, family, subsets: inputs.subsets }),
			);
			const familyCompleted: PreparedArtifact[] = [];
			for (const kind of ['static', 'variable'] as const) {
				if (!family.distribution[kind]) continue;
				const prefix = preparedArtifactPrefix(id, kind, artifact);
				const directory = resolve(options.out, prefix);
				const stored = await store?.read(`${prefix}/manifest.json`);
				let manifest = stored
					? PreparedArtifactSchema.parse(
							JSON.parse(Buffer.from(stored).toString('utf8')),
						)
					: await readManifest(join(directory, 'manifest.json'));
				if (!manifest) {
					consola.info(`[artifacts] Building ${id} ${kind}`);
					const result = await buildFamily(
						context,
						family,
						inputs,
						kind === 'variable',
					);
					const assets = [...result.fonts, ...result.css].sort((a, b) =>
						a.filename < b.filename ? -1 : a.filename > b.filename ? 1 : 0,
					);
					manifest = PreparedArtifactSchema.parse({
						schemaVersion: 1,
						id,
						kind,
						artifact,
						profile: PROFILE,
						metadata: family,
						manifest: {
							schemaVersion: 1,
							family: family.family,
							sourceModified: family.sourceModified,
							faces: result.faces,
							entrypoints: result.entrypoints,
						},
						files: assets.map((asset) => {
							const bytes =
								typeof asset.content === 'string'
									? new TextEncoder().encode(asset.content)
									: asset.content;
							return {
								path: asset.filename,
								size: bytes.byteLength,
								sha256: digest(bytes),
								url: `${preparedArtifactUrl(id, kind, artifact)}/${asset.filename}`,
							};
						}),
					});
					for (const asset of assets) {
						const path = join(directory, asset.filename);
						await mkdir(dirname(path), { recursive: true });
						await writeFile(path, asset.content);
					}
					await writeFile(join(directory, 'manifest.json'), json(manifest));
				}
				if (
					manifest.artifact !== artifact ||
					manifest.id !== id ||
					manifest.kind !== kind ||
					JSON.stringify(manifest.metadata) !== JSON.stringify(family)
				)
					throw new Error(`${id}: local artifact identity mismatch`);
				for (const file of manifest.files) {
					if (stored && store) {
						if (
							!(await store.matches(
								`${prefix}/${file.path}`,
								file.size,
								file.sha256,
							))
						)
							throw new Error(`${id}: stored artifact is missing ${file.path}`);
						continue;
					}
					const bytes = await readFile(join(directory, file.path));
					if (bytes.byteLength !== file.size || digest(bytes) !== file.sha256)
						throw new Error(
							`${id}: artifact integrity mismatch for ${file.path}`,
						);
					await store?.put(
						`${prefix}/${file.path}`,
						bytes,
						file.path.endsWith('.css')
							? 'text/css; charset=utf-8'
							: 'font/woff2',
					);
				}
				// Exact manifests can be read once this kind is complete; discovery
				// waits until every declared kind of the family is ready.
				if (!stored)
					await store?.put(
						`${prefix}/manifest.json`,
						Buffer.from(json(manifest)),
						'application/json',
					);
				familyCompleted.push(manifest);
				consola.success(
					`[artifacts] Ready ${id} ${kind}: ${manifest.files.length} files`,
				);
			}
			for (const manifest of familyCompleted) {
				const pointer = `prepared/${id}/${manifest.kind}/current.json`;
				if (!store)
					await writeFile(resolve(options.out, pointer), json(artifact));
				await store?.put(
					pointer,
					Buffer.from(json(artifact)),
					'application/json',
					true,
				);
				completed.push(manifest);
			}
		}
	} finally {
		context.destroy();
	}
	return completed;
}

export async function createArtifactStore() {
	const {
		S3Client,
		GetObjectCommand,
		HeadObjectCommand,
		PutObjectCommand,
		S3ServiceException,
	} = await import('@aws-sdk/client-s3');
	const required = (name: string) => {
		const value = process.env[name];
		if (!value) throw new Error(`Missing environment variable ${name}`);
		return value;
	};
	const client = new S3Client({
		endpoint: required('R2_S3_ENDPOINT'),
		region: 'auto',
		credentials: {
			accessKeyId: required('R2_ACCESS_KEY_ID'),
			secretAccessKey: required('R2_SECRET_ACCESS_KEY'),
		},
		requestChecksumCalculation: 'WHEN_REQUIRED',
	});
	const read = async (key: string) => {
		try {
			const object = await client.send(
				new GetObjectCommand({ Bucket: 'fontsource-artifacts', Key: key }),
			);
			if (!object.Body) throw new Error(`Missing body for ${key}`);
			return await object.Body.transformToByteArray();
		} catch (error) {
			if (
				error instanceof S3ServiceException &&
				error.$metadata.httpStatusCode === 404
			)
				return undefined;
			throw error;
		}
	};
	const matches = async (key: string, size: number, sha256: string) => {
		try {
			const existing = await client.send(
				new HeadObjectCommand({ Bucket: 'fontsource-artifacts', Key: key }),
			);
			if (
				existing.ContentLength !== size ||
				existing.Metadata?.sha256 !== sha256
			)
				throw new Error(`Existing artifact does not match ${key}`);
			return true;
		} catch (error) {
			if (
				!(
					error instanceof S3ServiceException &&
					error.$metadata.httpStatusCode === 404
				)
			)
				throw error;
			return false;
		}
	};
	const put = async (
		key: string,
		body: Uint8Array,
		contentType: string,
		mutable = false,
	) => {
		const target = { Bucket: 'fontsource-artifacts', Key: key };
		const sha256 = digest(body);
		if (!mutable && (await matches(key, body.byteLength, sha256))) return;
		await client.send(
			new PutObjectCommand({
				...target,
				Body: body,
				ContentType: contentType,
				Metadata: { sha256 },
				CacheControl: mutable
					? 'no-cache'
					: 'public, max-age=31536000, immutable',
			}),
		);
	};
	return { read, put, matches };
}

if (import.meta.main) {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			inputs: { type: 'string' },
			out: { type: 'string' },
			'registry-url': { type: 'string' },
			revision: { type: 'string' },
			upload: { type: 'boolean', default: false },
		},
	});
	if (!values.inputs || !values.out)
		throw new Error('Specify --inputs and --out directories');
	await buildArtifacts(positionals, {
		inputs: values.inputs,
		out: values.out,
		registryUrl: values['registry-url'],
		revision: values.revision,
		upload: values.upload,
	});
}
