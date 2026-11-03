import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import fs from 'fs-extra';
import path from 'pathe';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { publishPackages } from '../src/publish';

const registry = vi.hoisted(() => ({
	versions: new Map<string, string>(),
	fail: new Set<string>(),
	published: [] as string[],
	credentials: [] as string[],
}));

// Packing uses the real npm CLI. Only registry reads/writes are replaced; no test
// can accidentally publish or perform Git operations.
vi.mock('execa', async (importOriginal) => {
	const actual = await importOriginal<typeof import('execa')>();
	return {
		...actual,
		execa: vi.fn(
			async (
				command: string,
				args: string[],
				options?: { cwd?: string; env?: Record<string, string> },
			) => {
				if (command === 'npm' && args[0] === 'pack')
					return actual.execa(command, args, options);
				if (command === 'npm' && args[0] === 'view') {
					const integrity = registry.versions.get(args[1]);
					return integrity
						? { exitCode: 0, stdout: JSON.stringify([integrity]), stderr: '' }
						: {
								exitCode: 1,
								stdout: JSON.stringify({ error: { code: 'E404' } }),
								stderr: 'Not found',
							};
				}
				if (command === 'npm' && args[0] === 'publish') {
					const name = path
						.basename(args[1])
						.replace(/-(\d+\.\d+\.\d+)\.tgz$/, '@$1');
					registry.credentials.push(options?.env?.NPM_CONFIG_USERCONFIG ?? '');
					if (registry.fail.has(name))
						return {
							exitCode: 1,
							stdout: '',
							stderr: 'Controlled network failure',
						};
					registry.published.push(name);
					registry.versions.set(
						name,
						`sha512-${createHash('sha512')
							.update(await fs.readFile(args[1]))
							.digest('base64')}`,
					);
					return { exitCode: 0, stdout: '', stderr: '' };
				}
				throw new Error(`Unexpected subprocess: ${command} ${args.join(' ')}`);
			},
		),
	};
});

const initialCwd = process.cwd();
let root: string;
beforeEach(async () => {
	root = await fs.mkdtemp(path.join(tmpdir(), 'publish-run-'));
	await fs.outputJson(path.join(root, 'packages', 'font', 'package.json'), {
		name: 'font-test',
		version: '6.0.0',
	});
	await fs.outputFile(
		path.join(root, 'packages', 'font', 'font.woff2'),
		'font bytes',
	);
	await fs.writeJson(path.join(root, 'font-publish.json'), {
		packages: ['packages'],
		commitMessage: 'release',
		yes: true,
	});
	process.chdir(root);
	vi.stubEnv('NPM_TOKEN', 'test-not-a-real-token');
	registry.versions.clear();
	registry.fail.clear();
	registry.published.length = 0;
	registry.credentials.length = 0;
});
afterEach(async () => {
	process.chdir(initialCwd);
	vi.unstubAllEnvs();
	await fs.remove(root);
});

const options = { git: false, report: 'report.json', yes: true };

it('publishes a finalized tarball and accepts an identical interrupted-run retry', async () => {
	const manifestPath = path.join(root, 'packages/font/package.json');
	const original = await fs.readFile(manifestPath);
	const first = await publishPackages('patch', options);
	expect(first.published).toHaveLength(1);
	const manifest = await fs.readJson(manifestPath);
	expect(manifest).toMatchObject({
		version: '6.0.1',
		publishHash: first.published[0].hash,
	});
	expect(registry.published).toEqual(['font-test@6.0.1']);
	expect(await publishPackages('patch', options)).toEqual({
		published: [],
		failed: [],
	});
	// npm succeeded, but a prior runner did not commit the new local baseline.
	await fs.writeFile(manifestPath, original);
	expect((await publishPackages('patch', options)).published).toHaveLength(1);
	expect(registry.published).toEqual(['font-test@6.0.1']);
	for (const file of registry.credentials)
		expect(await fs.pathExists(file)).toBe(false);
}, 15000);

it('rejects a conflicting published payload and restores the local baseline', async () => {
	const manifestPath = path.join(root, 'packages/font/package.json');
	const original = await fs.readFile(manifestPath, 'utf8');
	registry.versions.set('font-test@6.0.1', 'sha512-different');
	await expect(publishPackages('patch', options)).rejects.toThrow(
		'Failed to publish font-test',
	);
	expect(await fs.readFile(manifestPath, 'utf8')).toBe(original);
	expect(await fs.readJson(path.join(root, 'report.json'))).toMatchObject({
		published: [],
		failed: [
			{
				name: 'font-test',
				version: '6.0.1',
				error: expect.stringContaining('payload differs'),
			},
		],
	});
	expect(registry.published).toEqual([]);
});

it('reports partial failure, keeps only verified baselines, and cleans credentials', async () => {
	await fs.outputJson(path.join(root, 'packages', 'other', 'package.json'), {
		name: 'other-test',
		version: '6.0.0',
	});
	registry.fail.add('other-test@6.0.1');
	await expect(publishPackages('patch', options)).rejects.toThrow('other-test');
	const report = await fs.readJson(path.join(root, 'report.json'));
	expect(report.published.map((pkg: { name: string }) => pkg.name)).toEqual([
		'font-test',
	]);
	expect(report.failed.map((pkg: { name: string }) => pkg.name)).toEqual([
		'other-test',
	]);
	expect(
		await fs.readJson(path.join(root, 'packages/other/package.json')),
	).toEqual({ name: 'other-test', version: '6.0.0' });
	for (const file of registry.credentials)
		expect(await fs.pathExists(file)).toBe(false);
});
