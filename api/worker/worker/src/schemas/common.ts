import { z } from 'zod';

/** Shared error envelope matching the legacy JSON error response shape. */
export const ErrorResponseSchema = z.object({
	status: z.number().int().describe('HTTP status code'),
	error: z.string().describe('Human-readable error message'),
});

/** Path parameter for routes accepting a single font family identifier. */
export const IdParamSchema = z.object({
	id: z
		.string()
		.min(1)
		.describe('Font family identifier (e.g. "roboto", "open-sans")'),
});

/** Path parameters for CDN asset routes. */
export const TagFileParamSchema = z.object({
	tag: z
		.string()
		.min(1)
		.describe('Font tag in the format "{id}@{version}" or "{id}:vf@{version}"'),
	file: z
		.string()
		.min(1)
		.describe('Asset filename (e.g. "latin-400-normal.woff2", "download.zip")'),
});

/** Path parameters for the legacy file redirect endpoint. */
export const FileRedirectParamSchema = z.object({
	id: z.string().min(1).describe('Font family identifier'),
	file: z.string().min(1).describe('Asset filename or "download.zip"'),
});
