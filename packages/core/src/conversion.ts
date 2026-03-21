import { type FontRef, WoffCompressionContext } from '@glypht/core';
import type { FontContext } from './context';
import type { FontFormat } from './types';
import { normalizeKebabCase } from './utils';

export interface ConversionResult {
	filename: string;
	format: FontFormat;
	data: Uint8Array;
}

/**
 * Converts a font buffer into multiple webfont formats (TTF, WOFF, WOFF2).
 *
 * @param ctx Shared FontContext to reuse WASM instances.
 * @param buffer The input font data (TTF, WOFF, or WOFF2).
 * @param formats The target formats to generate.
 * @param name Optional original filename to preserve naming conventions.
 * @returns A promise that resolves to an array of conversion results with data and filenames.
 */
export const convertFont = async (
	ctx: FontContext,
	buffer: Uint8Array,
	formats: FontFormat[],
	name?: string,
): Promise<ConversionResult[]> => {
	const { glyphtContext, compressionContext } = ctx;

	// Identify and decompress compressed inputs to get a raw TTF buffer.
	const type = WoffCompressionContext.compressionType(buffer);
	const ttfBuffer = type
		? await compressionContext.decompressToTTF(buffer)
		: buffer;

	let baseName: string;
	let fontRef: FontRef | undefined;

	// Determine the base filename using the provided name or font metadata.
	if (name) {
		const lastDot = name.lastIndexOf('.');
		baseName = lastDot === -1 ? name : name.slice(0, lastDot);
	} else {
		[fontRef] = await glyphtContext.loadFonts([ttfBuffer]);

		// If we can't load the font to extract metadata, fall back to a generic name.
		if (fontRef) {
			const family = normalizeKebabCase(fontRef.familyName);
			const subFamily = normalizeKebabCase(fontRef.subfamilyName);
			baseName = `${family}-${subFamily}`;
		} else {
			baseName = 'font';
		}
	}

	return Promise.all(
		formats.map(async (format): Promise<ConversionResult> => {
			if (format === 'ttf') {
				return {
					filename: `${baseName}.ttf`,
					format: 'ttf',
					data: ttfBuffer,
				};
			}

			// Recompress the TTF buffer into the requested webfont format.
			const data = await compressionContext.compressFromTTF(ttfBuffer, {
				algorithm: format,
			});

			return {
				filename: `${baseName}.${format}`,
				format,
				data,
			};
		}),
	);
};
