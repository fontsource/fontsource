import { EventEmitter } from 'node:events';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import {
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
	S3ServiceException,
} from '@aws-sdk/client-s3';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
	packageManifest,
	packageMetadata,
} from '../../api/tests/fixtures/publication';
import { releaseFonts } from './release';

const commands = vi.hoisted(() => ({
	build: async () => {},
	publish: async () => {},
	publishes: 0,
}));
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(async () => {}) }));
vi.mock('node:child_process', async (original) => {
	const actual = await original<typeof import('node:child_process')>();
	return {
		...actual,
		spawn: (command: string, args: string[], options: unknown) => {
			if (
				args[0]?.endsWith('/packages/cli/dist/cli.mjs') ||
				args[0]?.endsWith('/packages/publish/dist/cli.mjs')
			) {
				const child = new EventEmitter();
				queueMicrotask(async () => {
					try {
						if (args[0].includes('/publish/')) {
							commands.publishes++;
							await commands.publish();
						} else await commands.build();
						child.emit('exit', 0);
					} catch (error) {
						child.emit('error', error);
					}
				});
				return child;
			}
			return actual.spawn(
				command,
				args,
				options as import('node:child_process').SpawnOptions,
			);
		},
	};
});

let root: string;
let repository: string;
let out: string;
let rejectPublication = false;
const npmVersions = new Map<
	string,
	{ name: string; version: string; publishHash?: string }
>();
const writeJson = (path: string, value: unknown) =>
	writeFile(path, JSON.stringify(value));
beforeEach(async () => {
	root = await mkdtemp(join(tmpdir(), 'release-proof-'));
	repository = join(root, 'font-files');
	out = join(root, 'release');
	await mkdir(join(repository, 'fonts/google/abel'), { recursive: true });
	await mkdir(join(repository, 'metadata'), { recursive: true });
	await writeJson(join(repository, 'font-publish.json'), {
		packages: ['fonts/google'],
	});
	await writeJson(join(repository, 'fonts/google/abel/package.json'), {
		name: '@fontsource/abel',
		version: '5.2.0',
		publishHash: 'old',
	});
	await writeFile(join(repository, 'fonts/google/abel/old.woff'), 'old font');
	await writeJson(join(repository, 'metadata/published.json'), {
		abel: { static: '5.2.0' },
		removed: { static: '5.1.0' },
	});
	commands.publishes = 0;
	vi.mocked(delay).mockClear();
	npmVersions.clear();
	rejectPublication = false;
	commands.build = async () => {
		const directory = join(out, 'packages/static/abel');
		await mkdir(join(directory, 'files'), { recursive: true });
		await writeJson(join(directory, 'package.json'), {
			name: '@fontsource/abel',
			version: '6.0.0',
		});
		await writeJson(join(directory, 'metadata.json'), {
			...packageMetadata,
			id: 'abel',
			provider: 'google',
		});
		await writeJson(join(directory, 'manifest.json'), packageManifest);
		await writeFile(
			join(directory, 'files/abel-latin-400-normal.woff2'),
			'web font bytes',
		);
	};
	commands.publish = async () => {
		const plan = JSON.parse(
			await readFile(join(out, 'release-plan.json'), 'utf8'),
		);
		const published = plan
			.filter((pkg: { changed: boolean }) => pkg.changed)
			.map(
				(pkg: {
					name: string;
					directory: string;
					version: string;
					hash: string;
				}) => ({
					name: pkg.name,
					path: pkg.directory,
					bumpVersion: pkg.version,
					hash: pkg.hash,
				}),
			);
		await writeJson(join(out, 'publish-report.json'), {
			published,
			failed: rejectPublication ? [{ name: 'other-font' }] : [],
		});
		for (const pkg of published) {
			const path = join(out, pkg.path, 'package.json');
			const metadata = JSON.parse(await readFile(path, 'utf8'));
			await writeJson(path, { ...metadata, publishHash: pkg.hash });
		}
		if (rejectPublication) throw new Error('One other npm package failed');
	};
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: string | URL) => {
			const url = new URL(input);
			if (url.hostname === 'registry.npmjs.org') {
				const value = npmVersions.get(url.pathname);
				return value
					? new Response(JSON.stringify(value))
					: new Response('missing', { status: 404 });
			}
			return new Response(
				JSON.stringify({
					id: 'abel',
					kind: 'static',
					version: '6.0.0',
					manifest: packageManifest,
					metadata: { ...packageMetadata, id: 'abel', provider: 'google' },
				}),
			);
		}),
	);
	vi.stubEnv('R2_S3_ENDPOINT', 'https://r2.test');
	vi.stubEnv('R2_ACCESS_KEY_ID', 'test');
	vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test');
	vi.spyOn(S3Client.prototype, 'send').mockImplementation(
		async (command: unknown) => {
			if (command instanceof HeadObjectCommand)
				throw new S3ServiceException({
					name: 'NotFound',
					$fault: 'client',
					$metadata: { httpStatusCode: 404 },
				});
			if (command instanceof PutObjectCommand) return {};
			throw new Error('Unexpected storage operation');
		},
	);
});
afterEach(async () => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
	vi.unstubAllEnvs();
	await rm(root, { recursive: true, force: true });
});

it('plans v6 locally without publishing, uploading, or modifying the font-files baseline', async () => {
	const result = await releaseFonts(['abel'], { fontFiles: repository, out });
	expect(result.plan).toMatchObject([
		{
			name: '@fontsource/abel',
			version: '6.0.0',
			changed: true,
			destination: 'fonts/google/abel',
		},
	]);
	expect(commands.publishes).toBe(0);
	expect(S3Client.prototype.send).not.toHaveBeenCalled();
	expect(
		JSON.parse(
			await readFile(
				join(repository, 'fonts/google/abel/package.json'),
				'utf8',
			),
		).version,
	).toBe('5.2.0');
});

it('retains unchanged v6 versions and increments only changed packages', async () => {
	const first = await releaseFonts(['abel'], { fontFiles: repository, out });
	await writeJson(join(repository, 'fonts/google/abel/package.json'), {
		name: '@fontsource/abel',
		version: '6.2.3',
		publishHash: first.plan[0].hash,
	});
	out = join(root, 'unchanged');
	const unchanged = await releaseFonts(['abel'], {
		fontFiles: repository,
		out,
	});
	expect(unchanged.plan).toMatchObject([{ version: '6.2.3', changed: false }]);
	await writeJson(join(repository, 'fonts/google/abel/package.json'), {
		name: '@fontsource/abel',
		version: '6.2.3',
		publishHash: 'different previous output',
	});
	out = join(root, 'changed');
	const changed = await releaseFonts(['abel'], { fontFiles: repository, out });
	expect(changed.plan).toMatchObject([{ version: '6.2.4', changed: true }]);
});

it('promotes verified successes after a partial npm failure, preserves removed fonts, and removes obsolete package files', async () => {
	rejectPublication = true;
	await expect(
		releaseFonts(['abel'], { fontFiles: repository, out, publish: true }),
	).rejects.toThrow('Release incomplete');
	expect(
		JSON.parse(
			await readFile(join(repository, 'metadata/published.json'), 'utf8'),
		),
	).toEqual({ abel: { static: '6.0.0' }, removed: { static: '5.1.0' } });
	expect(
		await readFile(
			join(repository, 'fonts/google/abel/files/abel-latin-400-normal.woff2'),
			'utf8',
		),
	).toBe('web font bytes');
	await expect(
		readFile(join(repository, 'fonts/google/abel/old.woff')),
	).rejects.toMatchObject({ code: 'ENOENT' });
	const uploads = vi
		.mocked(S3Client.prototype.send)
		.mock.calls.map(([command]) => command)
		.filter((command) => command instanceof PutObjectCommand);
	expect(uploads.map((command) => command.input.Key)).toEqual([
		'release/preflight.json',
		'abel@6.0.0/latin-400-normal.woff2',
	]);
	expect(
		JSON.parse(await readFile(join(out, 'release-result.json'), 'utf8'))
			.promoted,
	).toEqual(['fonts/google/abel', 'metadata/published.json']);
});

it('retains the previous release when the exact API payload differs', async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn(async (input: string | URL) =>
			new URL(input).hostname === 'registry.npmjs.org'
				? new Response('missing', { status: 404 })
				: new Response(
						JSON.stringify({
							id: 'abel',
							kind: 'static',
							version: '6.0.0',
							manifest: {},
							metadata: packageMetadata,
						}),
					),
		),
	);
	await expect(
		releaseFonts(['abel'], { fontFiles: repository, out, publish: true }),
	).rejects.toThrow('differs');
	expect(
		JSON.parse(
			await readFile(
				join(repository, 'fonts/google/abel/package.json'),
				'utf8',
			),
		).version,
	).toBe('5.2.0');
	expect(vi.mocked(S3Client.prototype.send).mock.calls).toHaveLength(1);
	expect(delay).not.toHaveBeenCalled();
});

it.each([
	['5.2.0', '6.0.0', '6.0.1'],
	['6.0.0', '6.0.1', '6.0.2'],
])(
	'advances occupied versions after an unpromoted release from %s',
	async (baseline, occupied, expected) => {
		await writeJson(join(repository, 'fonts/google/abel/package.json'), {
			name: '@fontsource/abel',
			version: baseline,
			publishHash: 'old baseline',
		});
		npmVersions.set(`/@fontsource/abel/${occupied}`, {
			name: '@fontsource/abel',
			version: occupied,
			publishHash: 'different unpromoted bytes',
		});
		const result = await releaseFonts(['abel'], { fontFiles: repository, out });
		expect(result.plan[0].version).toBe(expected);
	},
);

it('reuses an occupied candidate with the same content hash for exact publisher verification', async () => {
	const first = await releaseFonts(['abel'], { fontFiles: repository, out });
	out = join(root, 'retry');
	npmVersions.set('/@fontsource/abel/6.0.0', {
		name: '@fontsource/abel',
		version: '6.0.0',
		publishHash: first.plan[0].hash,
	});
	const result = await releaseFonts(['abel'], { fontFiles: repository, out });
	expect(result.plan[0]).toMatchObject({
		version: '6.0.0',
		changed: true,
		hash: first.plan[0].hash,
	});
});

it('waits for transient exact-output propagation errors and then promotes', async () => {
	const original = vi.mocked(fetch).getMockImplementation();
	const statuses = [404, 502, 503];
	vi.mocked(fetch).mockImplementation(async (input, init) => {
		if (
			new URL(String(input)).pathname.startsWith('/v1/packages/') &&
			statuses.length
		)
			return new Response('pending', { status: statuses.shift() });
		if (!original) throw new Error('Missing fetch fixture');
		return original(input, init);
	});
	const result = await releaseFonts(['abel'], {
		fontFiles: repository,
		out,
		publish: true,
	});
	expect(result.promoted).toContain('fonts/google/abel');
	expect(vi.mocked(delay).mock.calls.map(([wait]) => wait)).toEqual([
		2_000, 5_000, 10_000,
	]);
});

it('stops bounded propagation retries without advancing the baseline', async () => {
	const original = vi.mocked(fetch).getMockImplementation();
	vi.mocked(fetch).mockImplementation(async (input, init) => {
		if (new URL(String(input)).pathname.startsWith('/v1/packages/'))
			return new Response('pending', { status: 503 });
		if (!original) throw new Error('Missing fetch fixture');
		return original(input, init);
	});
	await expect(
		releaseFonts(['abel'], { fontFiles: repository, out, publish: true }),
	).rejects.toThrow('503');
	expect(delay).toHaveBeenCalledTimes(5);
	expect(
		JSON.parse(
			await readFile(join(repository, 'metadata/published.json'), 'utf8'),
		).abel.static,
	).toBe('5.2.0');
});

it('requires a successful R2 write before invoking npm publication', async () => {
	vi.mocked(S3Client.prototype.send).mockRejectedValue(
		new S3ServiceException({
			name: 'AccessDenied',
			$fault: 'client',
			$metadata: { httpStatusCode: 403 },
		}),
	);
	await expect(
		releaseFonts(['abel'], { fontFiles: repository, out, publish: true }),
	).rejects.toThrow();
	expect(commands.publishes).toBe(0);
	expect(
		JSON.parse(
			await readFile(
				join(repository, 'fonts/google/abel/package.json'),
				'utf8',
			),
		).version,
	).toBe('5.2.0');
});
