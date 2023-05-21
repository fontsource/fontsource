import { consola } from 'consola';
import * as dotenv from 'dotenv';
import { publish } from 'libnpmpublish';
import PQueue from 'p-queue';
import pacote from 'pacote';
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

export const writeUpdate = async (pkg: BumpObject): Promise<void> => {
	const pkgPath = path.join(pkg.path, 'package.json');
	const pkgJson: PackageJson = await fs.readJson(pkgPath);
	pkgJson.version = pkg.bumpVersion;
	pkgJson.publishHash = pkg.hash;
	await fs.writeFile(pkgPath, stringify(pkgJson));
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
		await writeUpdate(pkg);
		consola.success(`Successfully published ${colors.green(npmVersion)}!`);
	} catch (error) {
		const newPkg = { ...pkg, error };
		return newPkg;
	}

	return undefined;
};

const queue = new PQueue({ concurrency: 6 });

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

	// Collect errored out packages
	const publishArr = [];

	for (const pkg of bumped) {
		if (pkg && !pkg.noPublish) {
			const newPkg = queue.add(() => packPublish(pkg));
			publishArr.push(newPkg);
		}
	}

	const finishedPublish = await Promise.all(publishArr);
	const errArray = finishedPublish.filter(
		(pkg) => pkg !== undefined
	) as PublishObject[];

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
