import { consola } from 'consola';
import * as dotenv from 'dotenv';
import PQueue from 'p-queue';
import path from 'pathe';
import colors from 'picocolors';
import fs from 'fs-extra';

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
import type { BumpObject, PackageJson, PublishFlags } from './types';
import { mergeFlags } from './utils';
import stringify from 'json-stringify-pretty-compact';
import { confirm, isCancel } from '@clack/prompts';
import { execa } from 'execa';

const checkEnv = async () => {
	dotenv.config();
	// Ensure all env variables are loaded
	if (!process.env.GITHUB_TOKEN) {
		throw new Error(
			'Missing Github Personal Access Token (GITHUB_TOKEN) in environment! '
		);
	}
	if (!process.env.NPM_TOKEN) {
		throw new Error('Missing NPM access token! (NPM_TOKEN)');
	}
};

interface WriteOptions {
	version?: boolean;
	hash?: boolean;
}

export const writeUpdate = async (
	pkg: BumpObject,
	opts: WriteOptions
): Promise<void> => {
	const pkgPath = path.join(pkg.path, 'package.json');
	const pkgJson: PackageJson = await fs.readJson(pkgPath);
	if (opts.version) pkgJson.version = pkg.bumpVersion;
	if (opts.hash) pkgJson.publishHash = pkg.hash;
	await fs.writeFile(pkgPath, stringify(pkgJson));
};

interface PublishObject extends BumpObject {
	error?: unknown;
}

const packPublish = async (pkg: BumpObject): Promise<void | PublishObject> => {
	const npmVersion = `${pkg.name}@${pkg.bumpVersion}`;
	const publishFlags = ['--access', 'public', '--tag', 'latest'];
	try {
		await writeUpdate(pkg, { version: true });
		await execa('npm', ['publish', ...publishFlags], {
			cwd: pkg.path,
		});
		await writeUpdate(pkg, { hash: true });
	} catch (error) {
		consola.error(`Failed to publish ${npmVersion}!`);
		throw error;
	}

	consola.success(`Successfully published ${colors.green(npmVersion)}!`);
	return undefined;
};

const queue = new PQueue({ concurrency: 8 });

export const publishPackages = async (
	version: string,
	options: PublishFlags
) => {
	consola.info(
		`${colors.bold(colors.blue('Publishing packages...'))} ${
			options.forcePublish ? colors.red(colors.bold('[FORCE]')) : ''
		}`
	);
	// Check for required environment variables
	await checkEnv();
	const { name } = await getGitConfig();

	const config = await mergeFlags(options);
	const diff = await getChanged(config);
	const bumped = await bumpPackages(diff, version);
	if (!config.yes) {
		const yes = await confirm({ message: `Publish packages?` });
		if (!yes || isCancel(yes)) {
			throw new Error('Bump cancelled.');
		}
	}

	// Setup .npmrc
	const npmrc = path.join(process.cwd(), '.npmrc');
	await fs.writeFile(
		npmrc,
		`//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}`
	);

	// Collect errored out packages
	const publishArr = [];

	for (const pkg of bumped) {
		if (pkg && !pkg.noPublish) {
			const newPkg = queue.add(() => packPublish(pkg));
			publishArr.push(newPkg);
		}
	}

	await Promise.all(publishArr);

	// Cleanup .npmrc
	await fs.remove(npmrc);

	// Stage all files
	await gitAdd();

	// Commit changes
	const commitMessage = getCommitMessage(config, bumped);
	await gitCommit(commitMessage);

	// Push changes
	await gitRemoteAdd(name);
	await gitPush();
};

queue.on('error', (error) => {
	throw error;
});
