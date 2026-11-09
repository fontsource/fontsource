import { tmpdir } from 'node:os';
import { confirm, isCancel } from '@clack/prompts';
import { consola } from 'consola';
import * as dotenv from 'dotenv';
import { execa } from 'execa';
import fs from 'fs-extra';
import PQueue from 'p-queue';
import path from 'pathe';
import { bumpPackages } from './bump';
import { getChanged } from './changed';
import {
	getCommitMessage,
	getGitConfig,
	gitAdd,
	gitCommit,
	gitPush,
	gitRemoteAdd,
} from './git';
import type { BumpObject, PublishFlags } from './types';
import { mergeFlags, writeUpdate } from './utils';

export interface PublishReport {
	published: BumpObject[];
	failed: { name: string; path: string; version: string; error: string }[];
}

async function registryIntegrity(spec: string): Promise<string | null> {
	const result = await execa(
		'npm',
		['view', spec, 'dist.integrity', '--json'],
		{ reject: false },
	);
	const value: unknown = JSON.parse(result.stdout || '{}');
	if (result.exitCode !== 0) {
		if (
			typeof value === 'object' &&
			value !== null &&
			'error' in value &&
			typeof value.error === 'object' &&
			value.error !== null &&
			'code' in value.error &&
			value.error.code === 'E404'
		)
			return null;
		throw new Error(`Cannot verify ${spec}: ${result.stderr}`);
	}
	const integrity =
		Array.isArray(value) && value.length === 1 ? value[0] : value;
	if (typeof integrity !== 'string' || !integrity.startsWith('sha512-'))
		throw new Error(`Missing package integrity for ${spec}`);
	return integrity;
}

async function packPublish(
	pkg: BumpObject,
	provenance: boolean,
): Promise<void> {
	const spec = `${pkg.name}@${pkg.bumpVersion}`;
	const manifestPath = path.join(pkg.path, 'package.json');
	const original = await fs.readFile(manifestPath);
	const temporary = await fs.mkdtemp(
		path.join(tmpdir(), 'fontsource-publish-'),
	);
	let verified = false;
	try {
		// The hash belongs in the published package, not only in the local baseline.
		await writeUpdate(pkg, { version: true, hash: true });
		const { stdout } = await execa(
			'npm',
			['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
			{ cwd: pkg.path },
		);
		const [packed] = Object.values(JSON.parse(stdout)) as [
			{ filename: string; integrity: string },
		];
		if (
			!packed.integrity?.startsWith('sha512-') ||
			path.basename(packed.filename) !== packed.filename
		)
			throw new Error(`Invalid packed output for ${spec}`);
		let integrity = await registryIntegrity(spec);
		if (integrity === null) {
			const npmrc = path.join(temporary, '.npmrc');
			await fs.writeFile(
				npmrc,
				// biome-ignore lint/suspicious/noTemplateCurlyInString: npm resolves the environment variable.
				'//registry.npmjs.org/:_authToken=${NPM_TOKEN}\n',
				{ mode: 0o600 },
			);
			const result = await execa(
				'npm',
				[
					'publish',
					path.join(temporary, packed.filename),
					'--access',
					'public',
					'--tag',
					'latest',
					'--ignore-scripts',
					...(provenance ? ['--provenance'] : []),
				],
				{
					env: { NPM_CONFIG_USERCONFIG: npmrc },
					reject: false,
				},
			);
			// Also reconcile ambiguous failures: npm may have accepted the bytes before a timeout.
			integrity = await registryIntegrity(spec);
			if (integrity === null)
				throw new Error(`Publication failed for ${spec}: ${result.stderr}`);
		}
		if (integrity !== packed.integrity)
			throw new Error(
				`Published payload differs for ${spec}; refusing to accept it as a retry`,
			);
		verified = true;
		consola.success(`Verified ${spec}`);
	} finally {
		try {
			if (!verified) await fs.writeFile(manifestPath, original);
		} finally {
			await fs.remove(temporary);
		}
	}
}

export const publishPackages = async (
	version: string,
	options: PublishFlags,
): Promise<PublishReport> => {
	dotenv.config();
	// A failed new attempt must never leave a previous run's success report behind.
	if (options.report) await fs.remove(options.report);
	if (!process.env.NPM_TOKEN)
		throw new Error('Missing NPM access token (NPM_TOKEN).');
	if (options.git !== false && !process.env.GITHUB_TOKEN)
		throw new Error('Missing GitHub token (GITHUB_TOKEN).');
	const config = await mergeFlags(options);
	const bumped = await bumpPackages(await getChanged(config), version);
	if (!config.yes && bumped.length > 0) {
		const yes = await confirm({ message: 'Publish packages?' });
		if (!yes || isCancel(yes)) throw new Error('Publish cancelled.');
	}
	const queue = new PQueue({ concurrency: 8 });
	const report: PublishReport = { published: [], failed: [] };
	await Promise.all(
		bumped
			.filter((pkg) => !pkg.noPublish)
			.map((pkg) =>
				queue.add(async () => {
					try {
						await packPublish(pkg, Boolean(options.provenance));
						report.published.push(pkg);
					} catch (error) {
						report.failed.push({
							name: pkg.name,
							path: pkg.path,
							version: pkg.bumpVersion,
							error: error instanceof Error ? error.message : String(error),
						});
					}
				}),
			),
	);
	report.published.sort((a, b) => a.path.localeCompare(b.path));
	report.failed.sort((a, b) => a.path.localeCompare(b.path));
	if (options.report) {
		const target = path.resolve(options.report);
		await fs.ensureDir(path.dirname(target));
		const temporary = await fs.mkdtemp(
			path.join(path.dirname(target), '.publish-report-'),
		);
		try {
			const staged = path.join(temporary, 'report.json');
			await fs.writeJson(staged, report, { spaces: 2 });
			await fs.rename(staged, target);
		} finally {
			await fs.remove(temporary);
		}
	}
	if (options.git !== false && report.published.length > 0) {
		const { name } = await getGitConfig();
		await gitAdd(report.published.map((pkg) => pkg.path));
		await gitCommit(getCommitMessage(config, report.published));
		await gitRemoteAdd(name);
		await gitPush();
	}
	if (report.failed.length > 0)
		throw new Error(
			`Failed to publish ${report.failed.map((pkg) => pkg.name).join(', ')}`,
		);
	return report;
};
