import defu from 'defu';
import stringify from 'json-stringify-pretty-compact';
import * as fs from 'node:fs/promises';
import * as path from 'pathe';

import type { Config, Flags } from '../types';
import { getHeadCommit } from './git';

const readConfig = async (): Promise<Config> => {
	const configPath = path.join(process.cwd(), 'mass-publish.json');
	return JSON.parse(await fs.readFile(configPath, 'utf8'));
};

const updateConfig = async (config: Config): Promise<void> => {
	const headCommit = await getHeadCommit();

	// Update commitFrom with HEAD commit
	const newConfig = config;
	newConfig.commitFrom = headCommit;

	const configPath = path.join(process.cwd(), 'mass-publish.json');
	await fs.writeFile(configPath, stringify(newConfig));
};

const mergeFlags = async (options: Flags): Promise<Config> => {
	const flags = {} as Config;
	// CLI args come in string format
	if (options.packages) flags.packages = options.packages.split(',');
	if (options.ignoreExtension) flags.ignoreExtension = options.ignoreExtension.split(',');

	return defu(flags, await readConfig());
};

export { mergeFlags, readConfig, updateConfig };
