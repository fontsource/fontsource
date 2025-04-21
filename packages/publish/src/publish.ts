import { confirm, isCancel } from '@clack/prompts';
import { consola } from 'consola';
import * as dotenv from 'dotenv';
import { execa } from 'execa';
import fs from 'fs-extra';
import PQueue from 'p-queue';
import path from 'pathe';
import colors from 'picocolors';

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
import type { BumpObject, Context, PublishFlags } from './types';
import { mergeFlags, writeUpdate } from './utils';

const checkEnv = async () => {
	dotenv.config();
	// Ensure all env variables are loaded
	if (!process.env.GITHUB_TOKEN) {
		throw new Error(
			'Missing Github Personal Access Token (GITHUB_TOKEN) in environment! ',
		);
	}
	if (!process.env.NPM_TOKEN) {
		throw new Error('Missing NPM access token! (NPM_TOKEN)');
	}
};

interface DoGitOptions {
	name: string;
	config: Context;
	bumped: BumpObject[];
}

let hasRun = false;

const doGitOperations = async ({ name, config, bumped }: DoGitOptions) => {
	if (hasRun) return;
	hasRun = true;

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

let errorCount = 0;

const packPublish = async (
	pkg: BumpObject,
	provenance: boolean,
	gitOpts: DoGitOptions,
): Promise<PublishObject> => {
	const npmVersion = `${pkg.name}@${pkg.bumpVersion}`;
	const publishFlags = ['--access', 'public', '--tag', 'latest'];
	if (provenance) {
		publishFlags.push('--provenance');
	}

	try {
		// Setup .npmrc
		const npmrc = path.join(pkg.path, '.npmrc');
		await fs.writeFile(npmrc, '//registry.npmjs.org/:_authToken=${NPM_TOKEN}');

		// Update version, then publish, then hash
		await writeUpdate(pkg, { version: true });
		await execa('npm', ['publish', ...publishFlags], {
			cwd: pkg.path,
		});
		await writeUpdate(pkg, { hash: true });

		// Remove .npmrc
		await fs.remove(npmrc);
	} catch (error) {
		consola.error(`Failed to publish ${npmVersion}!`);
		consola.error(error);
		// @ts-expect-error - This is a custom error thrown by execa
		const errorString = error.stderr as string;

		// If we get rate limited, throw the error to stop the queue
		// The retry delay should mean all other active publishes will also fail safely
		if (errorString.includes('429 Too Many Requests')) {
			await doGitOperations(gitOpts);
			throw error;
		}

		if (
			!errorString.includes(
				'You cannot publish over the previously published versions',
			)
		) {
			errorCount++;
		}

		// Otherwise, just reject the promise and store the error message so we can print it later
		return await Promise.reject(errorString);
	}

	consola.success(`Successfully published ${colors.green(npmVersion)}!`);
	return pkg;
};

export const publishPackages = async (
	version: string,
	options: PublishFlags,
) => {
	consola.info(
		`${colors.bold(colors.blue('Publishing packages...'))} ${
			options.forcePublish ? colors.red(colors.bold('[FORCE]')) : ''
		}`,
	);

	// Check for required environment variables
	await checkEnv();
	const { name } = await getGitConfig();

	const config = await mergeFlags(options);
	const diff = await getChanged(config);
	const bumped = await bumpPackages(diff, version);
	if (!config.yes) {
		const yes = await confirm({ message: 'Publish packages?' });
		if (!yes || isCancel(yes)) {
			throw new Error('Bump cancelled.');
		}
	}

	const queue = new PQueue({ concurrency: 8 });

	// Collect errored out packages
	const publishArr = [];

	for (const pkg of bumped) {
		if (pkg && !pkg.noPublish) {
			const newPkg = queue
				.add(() =>
					packPublish(pkg, Boolean(options.provenance), {
						name,
						config,
						bumped,
					}),
				)
				.catch((error) => {
					// Empty queue when we hit the error limit.
					if (errorCount > 10) {
						queue.pause();
						queue.clear();
						throw error;
					}
				});
			publishArr.push(newPkg);
		}
	}

	// We only want the build to crash on a 429 error
	// Otherwise, we want to continue publishing, commit and print the errors at the end
	const results = await Promise.allSettled(publishArr);

	// Filter errors
	const errors = results.filter((r) => r.status === 'rejected');

	await doGitOperations({ name, config, bumped });

	if (errors.length > 0) {
		throw new Error('Failed to publish packages!');
	}
};
