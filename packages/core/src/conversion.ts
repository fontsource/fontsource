import type { FontContext } from './context';
import { normalizeFontBuffer } from './normalize';
import type { FontFileFormat } from './types';
import { normalizeKebabCase } from './utils';

export interface ConversionResult {
	filename: string;
	format: FontFileFormat;
	data: Uint8Array;
}

const stripExtension = (name: string): string => {
	const lastDot = name.lastIndexOf('.');
	return lastDot === -1 ? name : name.slice(0, lastDot);
};

const deriveBaseName = async (
	glyphtContext: FontContext['glyphtContext'],
	ttfBuffer: Uint8Array,
): Promise<string> => {
	const fontRefs = await glyphtContext.loadFonts([ttfBuffer]);

	try {
		const [fontRef] = fontRefs;

		if (!fontRef) {
			return 'font';
		}

		const family = normalizeKebabCase(fontRef.familyName);
		const subFamily = normalizeKebabCase(fontRef.subfamilyName);
		return `${family}-${subFamily}`;
	} finally {
		for (const fontRef of fontRefs) {
			fontRef.destroy();
		}
	}
};

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
	formats: FontFileFormat[],
	name?: string,
): Promise<ConversionResult[]> => {
	const { glyphtContext, compressionContext } = ctx;
	const uniqueFormats = [...new Set(formats)];

	const ttfBuffer = await normalizeFontBuffer(ctx, buffer);

	const baseName = name
		? stripExtension(name)
		: await deriveBaseName(glyphtContext, ttfBuffer);

	return Promise.all(
		uniqueFormats.map(async (format): Promise<ConversionResult> => {
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
