import type { FontContext } from './context';
import { decodeDesktopFont } from './desktop-font';
import type { FontInspection } from './inspection';
import type { FontFileFormat } from './types';
import { normalizeKebabCase } from './utils';

export interface ConversionResult {
	filename: string;
	format: FontFileFormat;
	data: Uint8Array;
}

export class UnsupportedCffToTtfError extends Error {
	constructor() {
		super(
			'This font cannot be converted to TTF. Choose WOFF or WOFF2 instead.',
		);
		this.name = 'UnsupportedCffToTtfError';
	}
}

type FontTableInspection = Pick<FontInspection, 'tables'>;

const hasCffOutlines = (
	inspection: FontTableInspection | null | undefined,
): boolean =>
	inspection?.tables.includes('CFF ') === true ||
	inspection?.tables.includes('CFF2') === true;

export const planConversionFormats = (
	inspection: FontTableInspection | null | undefined,
	requestedFormats: FontFileFormat[],
): { formats: FontFileFormat[]; skippedTtf: boolean } => {
	// WOFF can retain CFF outlines, but TTF requires TrueType outlines.
	const skippedTtf =
		hasCffOutlines(inspection) && requestedFormats.includes('ttf');
	return {
		formats: skippedTtf
			? requestedFormats.filter((format) => format !== 'ttf')
			: requestedFormats,
		skippedTtf,
	};
};

const stripExtension = (name: string): string => {
	const lastDot = name.lastIndexOf('.');
	return lastDot === -1 ? name : name.slice(0, lastDot);
};

const deriveBaseName = async (
	glyphtContext: FontContext['glyphtContext'],
	fontBuffer: Uint8Array,
): Promise<string> => {
	const fontRefs = await glyphtContext.loadFonts([fontBuffer]);

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
 * @param buffer The input font data (TTF, OTF, WOFF, or WOFF2).
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

	const { bytes: sfntBytes, extension } = await decodeDesktopFont(ctx, buffer);
	if (uniqueFormats.includes('ttf') && extension === 'otf') {
		throw new UnsupportedCffToTtfError();
	}

	const baseName = name
		? stripExtension(name)
		: await deriveBaseName(glyphtContext, sfntBytes);

	return Promise.all(
		uniqueFormats.map(async (format): Promise<ConversionResult> => {
			if (format === 'ttf') {
				return {
					filename: `${baseName}.ttf`,
					format: 'ttf',
					data: sfntBytes,
				};
			}

			// Webfont compression preserves CFF outlines; it does not turn them into TTF.
			const data = await compressionContext.compressFromTTF(sfntBytes, {
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
