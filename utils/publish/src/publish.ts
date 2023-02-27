import consola from 'consola';
import * as dotenv from 'dotenv';
import { publish } from 'libnpmpublish';
import pacote from 'pacote';
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
import type { BumpObject, PublishFlags } from './types';
import { mergeFlags } from './utils';

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

interface PublishObject extends BumpObject {
	error?: unknown;
}

const packPublish = async (pkg: BumpObject): Promise<void | PublishObject> => {
	const npmVersion = `${pkg.name}@${pkg.bumpVersion}`;
	const packageManifest = await pacote.manifest(
		path.join(process.cwd(), pkg.path)
	);
	const tarData = await pacote.tarball(path.join(process.cwd(), pkg.path));
	const token = process.env.NPM_TOKEN;

	try {
		// @ts-ignore - libnpmpublish types are incorrect (probably)
		await publish(packageManifest, tarData, {
			access: 'public',
			npmVersion,
			token,
		});
		consola.success(`Successfully published ${npmVersion}!`);
	} catch (error) {
		const newPkg = { ...pkg, error };
		return newPkg;
	}

	return undefined;
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
	const bumped = await bumpPackages(diff, config, version);

	// Collect errored out packages
	const errArray = [];
	for (const pkg of bumped) {
		if (pkg && !pkg.noPublish) {
			const newPkg = await packPublish(pkg);
			if (newPkg) {
				errArray.push(newPkg);
			}
		}
	}

	// Write updated package.json files
	if (version !== 'from-package') {
		// Stage all files
		await gitAdd();

		// Commit changes
		const commitMessage = getCommitMessage(config, bumped);
		await gitCommit(commitMessage);

		// Push changes
		await gitRemoteAdd(name);
		await gitPush();
	}
	if (errArray.length > 0) {
		consola.error('The following packages failed to publish:');
		for (const pkg of errArray) {
			consola.error(`${pkg.name}@${pkg.bumpVersion}: ${pkg.error}`);
		}
		throw new Error('Failed to publish packages!');
	}
};
