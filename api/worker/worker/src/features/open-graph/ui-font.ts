import uiFontRegularDataUrl from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2?inline';
import uiFontBoldDataUrl from '@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-700-normal.woff2?inline';
import { UI_FONT_FAMILY } from './template';

const decodeInlineAsset = (value: string): Uint8Array => {
	const [, encoded = ''] = value.split(',', 2);
	const binary = atob(encoded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
};

const uiFontRegularData = decodeInlineAsset(uiFontRegularDataUrl);
const uiFontBoldData = decodeInlineAsset(uiFontBoldDataUrl);

export const UI_FONTS = [
	{
		name: UI_FONT_FAMILY,
		data: uiFontRegularData,
		weight: 400,
	},
	{
		name: UI_FONT_FAMILY,
		data: uiFontBoldData,
		weight: 700,
	},
] as const;
