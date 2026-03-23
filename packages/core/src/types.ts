/** Compressed webfont formats emitted by package builds. */
export type WebFontFormat = 'woff' | 'woff2';

/** Any font file format that a public config or asset reference may expose. */
export type FontFileFormat = WebFontFormat | 'ttf';

type UnicodeRangeMap = Record<string, string>;

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

interface FontBuildFeatures {
	featureSettings: Record<string, boolean>;
	subsetSources: Partial<UnicodeRangeMap>;
}

interface BaseFontBuildConfig
	extends FontIdentity,
		FontSelection,
		FontBuildFeatures {
	formats?: WebFontFormat[];
}

export interface StaticFontBuildConfig extends BaseFontBuildConfig {
	type: 'static';
}

export interface VariableFontBuildConfig extends BaseFontBuildConfig {
	type: 'variable';
	variable: VariableAxisConfig;
	axisKeys?: VariableAxisKey[];
}

export type FontBuildConfig = StaticFontBuildConfig | VariableFontBuildConfig;

export interface FontAsset extends FontSource {
	content: Uint8Array;
}

export interface CSSAsset {
	filename: string;
	content: string;
}

export interface CSSBuildOptions {
	/**
	 * Variable axis-key outputs to include explicitly. When omitted, expand to every published axis key.
	 */
	axisKeys?: VariableAxisKey[];
}

export interface FontBuildResult {
	css: CSSAsset[];
	fonts: FontAsset[];
	faces: FontFace[];
}
