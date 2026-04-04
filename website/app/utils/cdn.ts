import type { UrlResolver } from '@fontsource-utils/core';

export const jsDelivrResolver = (
	fontId: string,
	variable = false,
): UrlResolver => {
	const prefix = `${fontId}-`;
	const packageId = `${fontId}${variable ? ':vf' : ''}@latest`;

	const baseUrl = `https://cdn.jsdelivr.net/fontsource/fonts/${packageId}`;

	return ({ source }) => {
		// Strip the font id prefix from filename for our CDN endpoints.
		const filename = source.filename.startsWith(prefix)
			? source.filename.slice(prefix.length)
			: source.filename;

		return `${baseUrl}/${filename}`;
	};
};
