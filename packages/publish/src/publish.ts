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
import type { BumpObject, Context, PackageJson, PublishFlags } from './types';
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

interface DoGitOptions {
	name: string;
	config: Context;
	bumped: BumpObject[];
	npmrc: string;
}

let hasRun = false;

const doGitOperations = async ({
	name,
	config,
	bumped,
	npmrc,
}: DoGitOptions) => {
	if (hasRun) return;
	hasRun = true;

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

interface PublishObject extends BumpObject {
	error?: unknown;
}

const packPublish = async (
	pkg: BumpObject,
	gitOpts: DoGitOptions
): Promise<PublishObject> => {
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
		// @ts-ignore - This is a custom error thrown by execa
		const errorString = error.stderr as string;

		// If we get rate limited, throw the error to stop the queue
		// The retry delay should mean all other active publishes will also fail safely
		if (errorString.includes('429 Too Many Requests')) {
			await doGitOperations(gitOpts);
			throw error;
		}

		// Otherwise, just reject the promise and store the error message so we can print it later
		return Promise.reject(errorString);
	}

	consola.success(`Successfully published ${colors.green(npmVersion)}!`);
	return Promise.resolve(pkg);
};

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

	const queue = new PQueue({ concurrency: 8 });

	// Collect errored out packages
	const publishArr = [];

	for (const pkg of bumped) {
		if (pkg && !pkg.noPublish) {
			const newPkg = queue.add(() =>
				packPublish(pkg, { name, config, bumped, npmrc })
			);
			publishArr.push(newPkg);
		}
	}

	// We only want the build to crash on a 429 error
	// Otherwise, we want to continue publishing, commit and print the errors at the end
	const results = await Promise.allSettled(publishArr);

	// Print errors
	const errors = results.filter((r) => r.status === 'rejected');
	if (errors.length > 0) {
		consola.error('Failed to publish the following packages:');
		for (const error of errors) {
			if (error.status !== 'rejected') continue; // This should never happen, but ts is complaining
			consola.error(`${colors.red(error.reason)}`);
		}
	}

	await doGitOperations({ name, config, bumped, npmrc });

	if (errors.length > 0) {
		throw new Error('Failed to publish packages!');
	}
};
