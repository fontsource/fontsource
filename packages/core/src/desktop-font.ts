import type { FontContext } from './context';
import { normalizeFontBuffer } from './normalize';

/** Return uncompressed sfnt bytes with the extension matching their outlines. */
export const decodeDesktopFont = async (
	ctx: FontContext,
	buffer: Uint8Array,
): Promise<{ bytes: Uint8Array; extension: 'otf' | 'ttf' }> => {
	const bytes = await normalizeFontBuffer(ctx, buffer);
	// OTTO identifies CFF outlines; naming those bytes .ttf would mislabel the font.
	const extension =
		bytes[0] === 0x4f &&
		bytes[1] === 0x54 &&
		bytes[2] === 0x54 &&
		bytes[3] === 0x4f
			? 'otf'
			: 'ttf';
	return { bytes, extension };
};
