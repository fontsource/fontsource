export type Format = 'woff' | 'woff2';
export type FontFormat = Format | 'ttf';

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

export interface SubsetSlice {
	index: number;
	codepoints: number[];
}

export type SubsetDefinition =
	| {
			name: string;
			type: 'range';
			unicodeRange: string;
			codepoints: number[];
	  }
	| {
			name: string;
			type: 'sliced';
			slices: SubsetSlice[];
	  };

export type FontStyle =
	| 'normal'
	| 'italic'
	| `oblique ${number}deg`
	| `oblique ${number}deg ${number}deg`;

export interface FontSource {
	format: FontFormat;
	filename: string;
}

export interface FontFace {
	subset: string;
	weight: number | string;
	style: FontStyle;
	isVariable: boolean;
	unicodeRange: string;
	sources: FontSource[];
	axisKey?: string;
	stretch?: string | null;
	sliceIndex: number;
}

export interface FontConfig {
	id?: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: FontStyle[];
	unicodeRange?: Record<string, string>;
	variable?: VariableAxisConfig;
	formats?: Format[];
}

interface BaseFontBuildConfig extends FontConfig {
	featureSettings: Record<string, boolean>;
	subsetSources: Partial<Record<string, string>>;
}

export interface StaticFontBuildConfig extends BaseFontBuildConfig {
	type: 'static';
}

export interface VariableFontBuildConfig extends BaseFontBuildConfig {
	type: 'variable';
	axisKey?: string;
}

export type FontBuildConfig = StaticFontBuildConfig | VariableFontBuildConfig;

export interface FontAsset extends FontSource {
	content: Uint8Array;
}

export interface CSSAsset {
	filename: string;
	content: string;
}

export interface FontPackage {
	css: CSSAsset[];
	fonts: FontAsset[];
	faces: FontFace[];
}
