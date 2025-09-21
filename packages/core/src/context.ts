import { GlyphtContext, WoffCompressionContext } from '@glypht/core';

/**
 * Holds the expensive, reusable WASM contexts for font processing.
 * The consumer is responsible for calling destroy() when finished.
 */
export interface FontContext {
	readonly glyphtContext: GlyphtContext;
	readonly compressionContext: WoffCompressionContext;
	/**
	 * Destroys the underlying WASM instances to free up memory.
	 */
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
