import type { WoffCompressionContext } from '@glypht/core';

/**
 * Supported font file formats for web fonts.
 */
export type Format = 'woff' | 'woff2';

/**
 * Variable font axis definition with minimum and maximum values.
 * Used to define the range of values for variable font axes.
 */
export interface VariableFontAxis {
	/** Minimum value for this axis */
	min: number;
	/** Maximum value for this axis */
	max: number;
}

/**
 * Axis groups for variable fonts.
 * - standard: includes common axes (wght, wdth, slnt, opsz, ital)
 * - full: includes all available axes
 */
export type VariableAxisGroup = 'standard' | 'full';

/**
 * Axis key can be either a specific axis name or an axis group.
 */
export type VariableAxisKey = string | VariableAxisGroup;

/**
 * Configuration for variable font axes.
 * Defines which axes are supported and their ranges.
 */
export interface VariableAxisConfig {
	/** Weight axis (wght) configuration */
	wght?: VariableFontAxis;
	/** Slant axis (slnt) configuration */
	slnt?: VariableFontAxis;
	/** Width axis (wdth) configuration */
	wdth?: VariableFontAxis;
	/** Optical size axis (opsz) configuration */
	opsz?: VariableFontAxis;
	/** Italic axis (ital) configuration */
	ital?: VariableFontAxis;
	/** Support for any custom axes */
	[key: string]: VariableFontAxis | undefined;
}

/**
 * A single slice of a larger character set, typically used for CJK fonts.
 * Large fonts are split into multiple slices to reduce individual file sizes.
 */
export interface SubsetSlice {
	/** Slice index (e.g., 1, 2, 3...) */
	index: number;
	/** The specific Unicode codepoints included in this slice */
	codepoints: number[];
}

/**
 * Definition of a font subset, which can be either a complete subset
 * or split into multiple slices for large character sets.
 */
export type SubsetDefinition =
	| {
			/** Name of the subset (e.g., 'latin', 'cyrillic') */
			name: string;
			/** Type indicating this is a complete subset */
			type: 'range';
			/** CSS unicode-range value for this subset */
			unicodeRange: string;
			/** All Unicode codepoints included in this subset */
			codepoints: number[];
	  }
	| {
			/** Name of the subset (e.g., 'japanese', 'chinese-simplified') */
			name: string;
			/** Type indicating this subset is split into slices */
			type: 'sliced';
			/** Array of slices that make up this subset */
			slices: SubsetSlice[];
	  };

/**
 * Base configuration shared between static and variable font builds.
 * Contains common properties needed for all font processing operations.
 */
interface BaseFontConfig {
	/** Font family name as it will appear in CSS */
	family: string;
	/** Array of subset names to include in the build */
	subsets: string[];
	/** Output formats to generate (woff, woff2) */
	formats: Format[];
	/** OpenType feature settings - maps feature tags to enabled/disabled state */
	featureSettings: Record<string, boolean>;
	/** Raw string content for each subset definition file */
	subsetSources: Partial<Record<string, string>>;
}

/**
 * Configuration for building static font files.
 * Static fonts contain discrete weight and style combinations.
 */
export interface StaticFontBuildConfig extends BaseFontConfig {
	/** Type discriminator for static fonts */
	type: 'static';
	/**
	 * Font weights to process.
	 * If omitted or empty, all weights found in the font files will be processed.
	 */
	weights?: number[];
	/**
	 * Font styles to process.
	 * If omitted or empty, all styles found in the font files will be processed.
	 */
	styles?: FontStyle[];
}

/**
 * Configuration for building variable font files.
 * Variable fonts contain ranges of weights/styles in a single file.
 */
export interface VariableFontBuildConfig extends BaseFontConfig {
	/** Type discriminator for variable fonts */
	type: 'variable';
	/** Variable font axis configuration with ranges instead of discrete values */
	variable: VariableAxisConfig;
	/** Axis key for filename generation (e.g., 'wght', 'standard', 'full') */
	axisKey?: VariableAxisKey;
}

/**
 * Discriminated union for font build configuration.
 * Supports both static and variable font builds.
 */
export type FontBuildConfig = StaticFontBuildConfig | VariableFontBuildConfig;

/**
 * Internal context object passed between processing functions.
 * Contains shared data and dependencies needed throughout the build process.
 */
export interface ProcessingContext {
	/** URL-safe family identifier (lowercase, hyphenated) */
	familyId: string;
	/** Build configuration for this font family */
	config: FontBuildConfig;
	/** WASM compression context for generating web font formats */
	compressionContext: WoffCompressionContext;
	/** Map of subset names to their definitions */
	subsets: Map<string, SubsetDefinition>;
}

/**
 * Represents a single generated file asset.
 * Can be either a CSS file or a font file.
 */
export interface OutputAsset {
	/** Filename relative to the package root */
	filename: string;
	/** File content as binary data */
	content: Uint8Array;
}

/**
 * The complete output for a font package.
 * Contains all generated CSS and font files ready for distribution.
 */
export interface FontPackage {
	/** Generated CSS files */
	css: OutputAsset[];
	/** Generated font files */
	fonts: OutputAsset[];
}

/**
 * Valid CSS font-style values.
 * Includes standard values plus oblique with specific angles.
 */
export type FontStyle = 'normal' | 'italic' | `oblique ${number}deg`;

/**
 * Base properties shared by all processed font variants.
 * Contains the common data needed for both static and variable fonts.
 */
interface BaseProcessedVariant {
	/** Font weight value (e.g., 400, 700) */
	weight: number;
	/** Font style (normal, italic, or oblique with angle) */
	style: FontStyle;
	/** Subset this variant belongs to */
	subset: string;
	/** Slice index for sliced subsets, 0 for full subsets */
	sliceIndex: number;
	/** Generated filename for this font file */
	filename: string;
	/** Binary font data */
	content: Uint8Array;
}

/**
 * A processed static font variant.
 * Represents a single weight/style combination from a static font.
 */
export interface StaticProcessedVariant extends BaseProcessedVariant {
	/** Type discriminator for static fonts */
	type: 'static';
}

/**
 * A processed variable font variant.
 * Represents a variable font with axis ranges.
 */
export interface VariableProcessedVariant extends BaseProcessedVariant {
	/** Type discriminator for variable fonts */
	type: 'variable';
	/** Variable font axis configuration and ranges */
	variable: VariableAxisConfig;
	/** Axis key used for this variant */
	axisKey: VariableAxisKey;
}

/**
 * Discriminated union for processed font variants.
 * Represents an intermediate format before final packaging,
 * supporting both static and variable fonts with type safety.
 */
export type ProcessedVariant =
	| StaticProcessedVariant
	| VariableProcessedVariant;
