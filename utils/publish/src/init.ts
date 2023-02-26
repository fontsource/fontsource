import stringify from 'json-stringify-pretty-compact';
import * as fs from 'node:fs/promises';
import * as path from 'pathe';

import type { Config } from './types';
import { getHeadCommit } from './utils/git';

const init = async (): Promise<void> => {
	const configPath = path.join(process.cwd(), 'mass-publish.json');

	const defaultConfig: Config = {
		packages: ['packages/'],
		ignoreExtension: [],
		commitMessage: 'chore: release new versions',
		commitFrom: await getHeadCommit(),
	};

	await fs.writeFile(configPath, stringify(defaultConfig));
};

export { init };
