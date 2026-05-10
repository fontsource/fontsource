export const IMMUTABLE_ASSET_CACHE_CONTROL =
	'public, max-age=31536000, immutable';

export const BINARY_CONTENT_TYPES = {
	woff2: 'font/woff2',
	woff: 'font/woff',
	ttf: 'font/ttf',
	zip: 'application/zip',
} as const;

export const getDownloadAttachmentFilename = (
	id: string,
	version: string,
): string => `${id}_${version}.zip`;

export const getDownloadContentDisposition = (
	id: string,
	version: string,
): string =>
	`attachment; filename="${getDownloadAttachmentFilename(id, version)}"`;
