import {
	generateIconStaticCSS,
	generateIconVariableCSS,
	generateV1CSS,
	generateV2CSS,
	generateVariableCSS,
} from '@fontsource-utils/cli';
import { type IDResponse, VariableMetadata } from 'common-api/types';
import { getVariableMetadata } from 'common-api/util';
import { StatusError } from 'itty-router';

import { type CSSFilename } from './types';

const makeFontFilePath = (
	tag: string,
	subset: string,
	weight: string,
	style: string,
	extension: string,
) => {
	return `https://r2.fontsource.org/fonts/${tag}/${subset}-${weight}-${style}.${extension}`;
};

const makeFontFileVariablePath = (tag: string, extension: string) => {
	return `https://r2.fontsource.org/fonts/${tag}/static/${tag}.${extension}`;
};

export const updateCss = async (
	tag: string,
	metadata: IDResponse,
	req: Request,
	env: Env,
) => {
	// Icons are handled differently
	if (metadata.category === 'icon') {
		const cssGenerate = generateIconStaticCSS(metadata, makeFontFilePath);
	}
};
