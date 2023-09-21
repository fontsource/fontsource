/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import { APIv2 } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import { makeFontFilePath } from '../utils';
import { generateV2CSS } from './css';

const packagerV2 = async (id: string, opts: BuildOptions) => {
	const metadata = APIv2[id];
	const cssGenerate = generateV2CSS(metadata, makeFontFilePath);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export { packagerV2 };
