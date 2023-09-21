/* eslint-disable no-await-in-loop */
import fs from 'fs-extra';
import { APIIconStatic, APIIconVariable } from 'google-font-metadata';
import * as path from 'pathe';

import type { BuildOptions } from '../types';
import { makeFontFilePath, makeVariableFontFilePath } from '../utils';
import { generateIconStaticCSS, generateIconVariableCSS } from './css';

const packagerIconsStatic = async (id: string, opts: BuildOptions) => {
	const cssGenerate = generateIconStaticCSS(
		APIIconStatic[id],
		makeFontFilePath,
	);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

const packagerIconsVariable = async (id: string, opts: BuildOptions) => {
	const icon = APIIconVariable[id];
	const cssGenerate = generateIconVariableCSS(icon, makeVariableFontFilePath);

	for (const item of cssGenerate) {
		const cssPath = path.join(opts.dir, item.filename);
		await fs.writeFile(cssPath, item.css);
	}
};

export {
	generateIconStaticCSS,
	generateIconVariableCSS,
	packagerIconsStatic,
	packagerIconsVariable,
};
