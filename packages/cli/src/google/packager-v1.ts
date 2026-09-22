import fs from 'fs-extra';
import { APIv1, APIv2 } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import { makeFontFilePath } from '../utils';
import { generateV1CSS } from './css';

const packagerV1 = async (id: string, opts: BuildOptions) => {
	const metadata = APIv1[id];
	const cssGenerate = generateV1CSS(
		{ ...metadata, unicodeRange: APIv2[id]?.unicodeRange },
		makeFontFilePath,
	);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export { packagerV1 };
