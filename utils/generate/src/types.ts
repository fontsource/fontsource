export interface Axes {
	min: number;
	max: number;
}

export interface Source {
	url: string;
	format: string;
}

export interface Variable {
	wght?: number[];
	stretch?: Axes;
	slnt?: Axes;
}

export interface FontObject {
	family: string;
	style: string;
	display: string;
	weight: number;
	src: Source[];
	variable?: Variable;
	unicodeRange?: string;
	comment?: string;
	spacer?: string;
}

export interface UnicodeRange {
	[subset: string]: string;
}

export interface FontMetadata {
	family: string;
	id?: string;
	styles: string[];
	display: string;
	weights: number[];
	formats: string[];
	subsets: string[];
	variable?: Variable;
	path?: string;
	unicodeRange?: UnicodeRange;
}
