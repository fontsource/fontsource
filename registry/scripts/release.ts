import { spawn } from 'node:child_process';
import {
	appendFile,
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rename,
	rm,
	stat,
	writeFile,
} from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual, parseArgs } from 'node:util';
import { getHash } from '@fontsource-utils/publish/hash';
import { z } from 'zod';
import {
	RegistryFamiliesSchema,
	RegistryFamilyDetailSchema,
	RegistryIdParamSchema,
} from '../../api/shared/registry.ts';
import {
	getStaticAssetKey,
	getVariableAssetKey,
} from '../../api/shared/storage.ts';
import { createArtifactStore } from './build-artifacts.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const PackageSchema = z
	.object({
		name: z.string().regex(/^@fontsource(?:-variable)?\/[a-z0-9][a-z0-9-]*$/),
		version: z.string().regex(/^\d+\.\d+\.\d+$/),
		publishHash: z.string().optional(),
	})
	.passthrough();
const json = async (path: string): Promise<unknown> =>
	JSON.parse(await readFile(path, 'utf8'));
const writeJson = (path: string, value: unknown) =>
	writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const publicationSchema = z.record(
	z.string(),
	z.object({ static: z.string().optional(), variable: z.string().optional() }),
);

interface ReleasePackage {
	name: string;
	id: string;
	kind: 'static' | 'variable';
	directory: string;
	destination: string;
	version: string;
	hash: string;
	changed: boolean;
}

export interface ReleaseOptions {
	fontFiles: string;
	out: string;
	registryUrl?: string;
	publish?: boolean;
}

function inside(root: string, path: string): string {
	const result = resolve(root, path);
	const child = relative(root, result);
	if (!child || child.startsWith('..') || isAbsolute(child))
		throw new Error(`Path escapes release root: ${path}`);
	return result;
}

const run = (entry: string, args: string[], cwd: string) =>
	new Promise<void>((resolve, reject) => {
		const child = spawn(process.execPath, [join(ROOT, entry), ...args], {
			cwd,
			stdio: 'inherit',
		});
		child.once('error', reject);
		child.once('exit', (code) =>
			code === 0
				? resolve()
				: reject(new Error(`${entry} exited with ${code}`)),
		);
	});

async function availableVersion(name: string, candidate: string, hash: string) {
	let version = candidate;
	while (true) {
		const response = await fetch(
			`https://registry.npmjs.org/${name}/${version}`,
			{
				signal: AbortSignal.timeout(30_000),
			},
		);
		if (response.status === 404) return version;
		if (!response.ok)
			throw new Error(
				`Cannot resolve ${name}@${version}: npm returned ${response.status}`,
			);
		const published = PackageSchema.parse(await response.json());
		if (published.name !== name || published.version !== version)
			throw new Error(`npm package identity mismatch for ${name}@${version}`);
		// An earlier run may have published without committing font-files. Reuse
		// matching content; the publisher still verifies the complete tarball.
		if (published.publishHash === hash) return version;
		const [major, minor, patch] = version.split('.').map(Number);
		version = `${major}.${minor}.${patch + 1}`;
	}
}

async function publishedOutput(url: URL) {
	// Newly published manifests can lag behind npm at the API's CDN upstream.
	// Invalid successful payloads are checked by the caller without retrying.
	for (const wait of [0, 2_000, 5_000, 10_000, 20_000, 30_000]) {
		if (wait) await delay(wait);
		const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
		if (response.ok) return response;
		await response.body?.cancel();
		if (![404, 502, 503].includes(response.status) || wait === 30_000)
			throw new Error(`Published output is not available: ${response.status}`);
	}
	throw new Error('Published output is not available');
}

async function replacePackage(source: string, destination: string) {
	await mkdir(dirname(destination), { recursive: true });
	const temporary = await mkdtemp(
		join(dirname(destination), '.fontsource-release-'),
	);
	let moved = false;
	try {
		await cp(source, join(temporary, 'new'), { recursive: true });
		try {
			await rename(destination, join(temporary, 'old'));
			moved = true;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
		}
		try {
			await rename(join(temporary, 'new'), destination);
		} catch (error) {
			if (moved) await rename(join(temporary, 'old'), destination);
			throw error;
		}
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
}

/** Downloads and plans locally. npm, R2 writes, and font-files changes require --publish. */
export async function releaseFonts(ids: string[], options: ReleaseOptions) {
	const repository = resolve(options.fontFiles);
	const output = resolve(options.out);
	const origin = options.registryUrl ?? 'https://api.fontsource.org';
	try {
		await stat(output);
		throw new Error('Release output must be a new directory');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
	if (!ids.length) {
		const response = await fetch(new URL('/v1/registry/families', origin), {
			signal: AbortSignal.timeout(30_000),
		});
		if (!response.ok)
			throw new Error(`Registry request failed: ${response.status}`);
		ids = RegistryFamiliesSchema.parse(await response.json()).map(
			({ id }) => id,
		);
	}
	for (const id of ids) RegistryIdParamSchema.parse({ id });
	const config = z
		.object({ packages: z.array(z.string()).min(1) })
		.parse(await json(join(repository, 'font-publish.json')));
	const roots = new Set(
		config.packages.map((path) =>
			relative(repository, inside(repository, path)),
		),
	);
	const baseline = new Map<
		string,
		{ path: string; metadata: z.infer<typeof PackageSchema> }
	>();
	for (const root of roots) {
		for (const entry of await readdir(join(repository, root), {
			withFileTypes: true,
		})) {
			if (!entry.isDirectory()) continue;
			const directory = join(root, entry.name);
			const metadata = PackageSchema.parse(
				await json(join(repository, directory, 'package.json')),
			);
			if (baseline.has(metadata.name))
				throw new Error(`Duplicate package ${metadata.name}`);
			baseline.set(metadata.name, { path: directory, metadata });
		}
	}
	await mkdir(output, { recursive: true });
	await run(
		'packages/cli/dist/cli.mjs',
		[
			'build',
			...ids,
			'--out',
			join(output, 'packages'),
			'--registry-url',
			origin,
		],
		ROOT,
	);
	const plan: ReleasePackage[] = [];
	for (const kind of ['static', 'variable'] as const) {
		const directory = join(output, 'packages', kind);
		await mkdir(directory, { recursive: true });
		for (const entry of await readdir(directory, { withFileTypes: true })) {
			if (!entry.isDirectory()) continue;
			const source = join(directory, entry.name);
			const metadata = RegistryFamilyDetailSchema.parse(
				await json(join(source, 'metadata.json')),
			);
			const pkg = PackageSchema.parse(await json(join(source, 'package.json')));
			const expected = `@fontsource${kind === 'variable' ? '-variable' : ''}/${metadata.id}`;
			if (pkg.name !== expected || entry.name !== metadata.id)
				throw new Error('Generated package identity mismatch');
			const previous = baseline.get(pkg.name);
			const root =
				kind === 'variable'
					? metadata.provider === 'google-icons'
						? 'fonts/variable-icons'
						: 'fonts/variable'
					: metadata.provider === 'google-icons'
						? 'fonts/icons'
						: metadata.provider === 'google'
							? 'fonts/google'
							: 'fonts/other';
			if (!previous && !roots.has(root))
				throw new Error(`Missing font-files package root ${root}`);
			const destination = previous?.path ?? join(root, metadata.id);
			inside(repository, destination);
			if (!/^[a-zA-Z0-9_./-]+$/.test(destination))
				throw new Error(`Unsupported package directory ${destination}`);
			pkg.version = previous?.metadata.version ?? '6.0.0';
			if (previous?.metadata.publishHash)
				pkg.publishHash = previous.metadata.publishHash;
			else delete pkg.publishHash;
			await writeJson(join(source, 'package.json'), pkg);
			const hash = await getHash(source);
			const changed = hash !== previous?.metadata.publishHash;
			if (changed) {
				const [major, minor, patch] = pkg.version.split('.').map(Number);
				pkg.version =
					previous && major >= 6 ? `${major}.${minor}.${patch + 1}` : '6.0.0';
				pkg.version = await availableVersion(pkg.name, pkg.version, hash);
				await writeJson(join(source, 'package.json'), pkg);
			}
			plan.push({
				name: pkg.name,
				id: metadata.id,
				kind,
				directory: relative(output, source),
				destination,
				version: pkg.version,
				hash,
				changed,
			});
		}
	}
	await writeJson(join(output, 'release-plan.json'), plan);
	console.log(
		`[release] ${plan.filter((pkg) => pkg.changed).length} changed packages out of ${plan.length}`,
	);
	if (!options.publish || !plan.some((pkg) => pkg.changed))
		return { plan, promoted: [] };
	// Validate local state and upload credentials before publishing anything to npm.
	const published = publicationSchema.parse(
		await json(join(repository, 'metadata/published.json')),
	);
	const store = await createArtifactStore();
	// Exercise bucket write permission before the irreversible npm publication.
	await store.put(
		'release/preflight.json',
		Buffer.from('{"schemaVersion":1}\n'),
		'application/json',
		true,
	);
	await writeJson(join(output, 'font-publish.json'), {
		packages: ['packages/static', 'packages/variable'],
		commitMessage: 'chore: release font packages',
		yes: true,
	});
	const reportPath = join(output, 'publish-report.json');
	let publicationError: unknown;
	try {
		await run(
			'packages/publish/dist/cli.mjs',
			[
				'publish',
				'from-package',
				'--yes',
				'--no-git',
				'--report',
				reportPath,
				...(process.env.GITHUB_ACTIONS === 'true' ? ['--provenance'] : []),
			],
			output,
		);
	} catch (error) {
		publicationError = error;
	}
	const report = z
		.object({
			published: z.array(
				z.object({
					name: z.string(),
					path: z.string(),
					bumpVersion: z.string(),
					hash: z.string(),
				}),
			),
			failed: z.array(z.unknown()),
		})
		.parse(await json(reportPath));
	const promoted: string[] = [];
	const failures: string[] = [];
	for (const result of report.published) {
		try {
			const pkg = plan.find((pkg) => pkg.name === result.name);
			if (
				!pkg ||
				pkg.directory !== result.path ||
				pkg.version !== result.bumpVersion ||
				pkg.hash !== result.hash
			)
				throw new Error('Published report does not match the release plan');
			const source = inside(output, pkg.directory);
			const response = await publishedOutput(
				new URL(`/v1/packages/${pkg.id}/${pkg.kind}/${pkg.version}`, origin),
			);
			const exact = z
				.object({
					id: z.string(),
					kind: z.string(),
					version: z.string(),
					manifest: z.unknown(),
					metadata: z.unknown(),
				})
				.parse(await response.json());
			if (
				exact.id !== pkg.id ||
				exact.kind !== pkg.kind ||
				exact.version !== pkg.version ||
				!isDeepStrictEqual(
					exact.manifest,
					await json(join(source, 'manifest.json')),
				) ||
				!isDeepStrictEqual(
					exact.metadata,
					await json(join(source, 'metadata.json')),
				)
			)
				throw new Error('Published output differs from the prepared package');
			for (const file of await readdir(join(source, 'files'))) {
				if (!file.startsWith(`${pkg.id}-`) || !file.endsWith('.woff2'))
					throw new Error(`Unexpected package asset ${file}`);
				const filename = file.slice(pkg.id.length + 1);
				const key = (
					pkg.kind === 'variable' ? getVariableAssetKey : getStaticAssetKey
				)(pkg.id, pkg.version, filename);
				await store.put(
					key,
					await readFile(join(source, 'files', file)),
					'font/woff2',
				);
			}
			await replacePackage(source, inside(repository, pkg.destination));
			published[pkg.id] = { ...published[pkg.id], [pkg.kind]: pkg.version };
			promoted.push(pkg.destination);
		} catch (error) {
			failures.push(
				`${result.name}: ${error instanceof Error ? error.message : error}`,
			);
		}
	}
	if (promoted.length) {
		await writeJson(
			join(repository, 'metadata/published.json'),
			Object.fromEntries(
				Object.entries(published).sort(([a], [b]) => a.localeCompare(b)),
			),
		);
		promoted.push('metadata/published.json');
	}
	await writeJson(join(output, 'release-result.json'), { promoted, failures });
	if (process.env.GITHUB_OUTPUT)
		await appendFile(
			process.env.GITHUB_OUTPUT,
			`commit_paths=${promoted.join(' ')}\n`,
		);
	if (publicationError || report.failed.length || failures.length)
		throw new Error(
			`Release incomplete: ${failures.join('; ') || 'npm publication failed; see publish-report.json'}`,
		);
	return { plan, promoted };
}

if (import.meta.main) {
	const { values } = parseArgs({
		options: {
			'font-files': { type: 'string' },
			out: { type: 'string' },
			fonts: { type: 'string' },
			'registry-url': { type: 'string' },
			publish: { type: 'boolean', default: false },
		},
	});
	if (!values['font-files'] || !values.out)
		throw new Error('Specify --font-files and --out');
	await releaseFonts(values.fonts?.split(',').filter(Boolean) ?? [], {
		fontFiles: values['font-files'],
		out: values.out,
		registryUrl: values['registry-url'],
		publish: values.publish,
	});
}
