import staticWoffUrl from './fonts/abel-latin-400-normal.woff?inline';
import staticWoff2Url from './fonts/abel-latin-400-normal.woff2?inline';
import variableWoff2Url from './fonts/recursive-latin-full-normal.woff2?inline';

const decodeInlineAsset = (value: string): Uint8Array => {
	const [, encoded = ''] = value.split(',', 2);
	const binary = atob(encoded);
	const bytes = new Uint8Array(binary.length);

	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}

	return bytes;
};

export const staticWoff2Bytes = decodeInlineAsset(staticWoff2Url);
export const staticWoffBytes = decodeInlineAsset(staticWoffUrl);
export const variableWoff2Bytes = decodeInlineAsset(variableWoff2Url);
export const staticTtfBytes = new Uint8Array([0, 1, 2, 3]);
