/** Compressed webfont formats emitted by package builds. */
export type WebFontFormat = 'woff' | 'woff2';

/** Any font file format that a public config or asset reference may expose. */
export type FontFileFormat = WebFontFormat | 'ttf';

type UnicodeRangeMap = Record<string, string>;

export interface FontSubsetSlice {
	/** Published numeric suffix for this slice. */
	id: number;
	/** CSS unicode-range covered by this slice. */
	unicodeRange: string;
}

export interface VariableFontAxis {
	default?: string | number;
	min: string | number;
	max: string | number;
	step?: string | number;
}

export interface VariableAxisConfig {
	wght?: VariableFontAxis;
	slnt?: VariableFontAxis;
	wdth?: VariableFontAxis;
	opsz?: VariableFontAxis;
	ital?: VariableFontAxis;
	[key: string]: VariableFontAxis | undefined;
}

type CustomVariableAxisKey = string & {};

/**
 * Published variable axis keys include the direct standard tags, aggregate
 * package keys, and any custom OpenType axis tag such as `MONO` or `CASL`.
 */
export type VariableAxisKey =
	| 'wght'
	| 'wdth'
	| 'slnt'
	| 'opsz'
	| 'standard'
	| 'full'
	| CustomVariableAxisKey;

export type FontStyle =
	| 'normal'
	| 'italic'
	| `oblique ${number}deg`
	| `oblique ${number}deg ${number}deg`;

export interface FontSource {
	format: FontFileFormat;
	filename: string;
}

interface FontFaceBase {
	subset: string;
	weight: number | string;
	style: FontStyle;
	unicodeRange: string;
	sliceIndex: number;
}

export interface FontFace extends FontFaceBase {
	isVariable: boolean;
	sources: FontSource[];
	axisKey?: VariableAxisKey;
	stretch?: string | null;
}

interface FontIdentity {
	id?: string;
	family: string;
}

interface FontSelection {
	subsets: string[];
	weights: number[];
	styles: FontStyle[];
	unicodeRange?: UnicodeRangeMap;
	/** Optional precomputed slices for large Unicode subsets such as CJK fonts. */
	subsetSlices?: Record<string, FontSubsetSlice[]>;
}

interface FormatOptions<TFormat extends FontFileFormat> {
	formats?: TFormat[];
}

export interface FontConfig
	extends FontIdentity,
		FontSelection,
		FormatOptions<FontFileFormat> {
	variable?: VariableAxisConfig;
}

export interface FontCharacterSet {
	subset: string;
	codepoints: number[];
	/** Numbered slices start at 1; named subsets omit this field. */
	sliceIndex?: number;
}

export type FontBuildCharacters = 'all' | FontCharacterSet[];

export type FontBuildTarget =
	| { type: 'static'; source: Uint8Array; weight: number; style: FontStyle }
	// Axes describe the available bundle; omitted axes are pinned to source defaults.
	| {
			type: 'variable';
			source: Uint8Array;
			style: FontStyle;
			axisKey: VariableAxisKey;
			axes: VariableAxisConfig;
	  };

export interface FontBuildConfig extends FontIdentity {
	targets: FontBuildTarget[];
	characters: FontBuildCharacters;
	featureSettings?: Record<string, boolean>;
	formats?: WebFontFormat[];
}

export interface FontAsset extends FontSource {
	content: Uint8Array;
}

export interface CSSAsset {
	filename: string;
	content: string;
}

export interface FontBuildResult {
	css: CSSAsset[];
	fonts: FontAsset[];
	faces: FontFace[];
}
