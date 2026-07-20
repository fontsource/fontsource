import { WoffCompressionContext } from '@glypht/core';
import type { FontContext } from './context';

/** Return an uncompressed OpenType buffer suitable for inspection or rebuilding. */
export const normalizeFontBuffer = async (
	ctx: FontContext,
	buffer: Uint8Array,
): Promise<Uint8Array> => {
	const compressionType = WoffCompressionContext.compressionType(buffer);
	return compressionType
		? ctx.compressionContext.decompressToTTF(buffer)
		: buffer;
};
