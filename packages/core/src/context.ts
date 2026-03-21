import { GlyphtContext, WoffCompressionContext } from '@glypht/core';

/**
 * Shared Glypht and WOFF contexts for font work.
 *
 * Reuse one instance across multiple operations, then call `destroy()`.
 */
export interface FontContext {
	readonly glyphtContext: GlyphtContext;
	readonly compressionContext: WoffCompressionContext;
	destroy: () => void;
}

/**
 * Creates and initializes the WASM contexts required for font processing.
 *
 * @returns A FontContext object.
 */
export const createFontContext = (): FontContext => {
	const glyphtContext = new GlyphtContext();
	const compressionContext = new WoffCompressionContext();

	return {
		glyphtContext,
		compressionContext,
		destroy: () => {
			glyphtContext.destroy();
			compressionContext.destroy();
		},
	};
};
