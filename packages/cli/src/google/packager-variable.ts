import fs from 'fs-extra';
import { APIv2, APIVariable } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import { makeVariableFontFilePath } from '../utils';
import { generateVariableCSS } from './css';

const packagerVariable = async (id: string, opts: BuildOptions) => {
	const font = APIv2[id];
	const fontVariable = APIVariable[id];

	const cssGenerate = generateVariableCSS(
		font,
		fontVariable,
		makeVariableFontFilePath,
	);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export { packagerVariable };
