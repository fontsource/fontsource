import fs from 'fs-extra';
import stringify from 'json-stringify-pretty-compact';
import path from 'pathe';

import type { Context } from './types';

const init = async (): Promise<void> => {
	const configPath = path.join(process.cwd(), 'font-publish.json');

	const defaultConfig: Context = {
		packages: ['./packages/'],
		commitMessage: 'chore: release new versions',
	};

	await fs.writeFile(configPath, stringify(defaultConfig));
};

export { init };
