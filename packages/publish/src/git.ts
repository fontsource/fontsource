import os from 'node:os';

import { execa } from 'execa';
import fs from 'fs-extra';
import parse from 'parse-git-config';
import path from 'pathe';

import type { BumpObject, Context, Git } from './types';

// Get Git config
export const getGitConfig = async (): Promise<Git> => {
	const configPath = path.join(os.homedir(), '.gitconfig');
	try {
		await fs.stat(configPath);
		const gitconfig = await parse({ cwd: '/', path: configPath });
		const author: Git = {
			name: gitconfig?.user.name,
			email: gitconfig?.user.email,
		};
		return author;
	} catch {
		throw new Error('Error reading Git config.');
	}
};

export const gitAdd = async (): Promise<void> => {
	await execa('git', ['add', '--all']);
};

export const gitCommit = async (message: string): Promise<void> => {
	await execa('git', ['commit', '-m', message]);
};

// Setup git remote
export const gitRemoteAdd = async (name: string): Promise<void> => {
	const remoteURL = await execa('git', [
		'config',
		'--get',
		'remote.origin.url',
	]);
	// Strip https:// from remote link get
	const strippedURL = new URL(remoteURL.stdout).host;

	// git remote add origin https://username:access-token@github.com/username/repo.git
	const publishURL = `https://${name}:${
		// biome-ignore lint/style/noNonNullAssertion: <explanation>
		process.env.GITHUB_TOKEN!
	}@${strippedURL}`;
	try {
		await execa('git', ['remote', 'add', 'origin', publishURL]);
	} catch {
		// Git origin already exists. Continue
	}
};

export const gitPush = async (): Promise<void> => {
	await execa('git', ['push', 'origin', 'main']);
};

export const getCommitMessage = (
	config: Context,
	pkgs: BumpObject[],
): string => {
	let { commitMessage } = config;

	for (const pkg of pkgs) {
		commitMessage += `\n- ${pkg.name}@${pkg.bumpVersion}`;
	}
	return commitMessage;
};
