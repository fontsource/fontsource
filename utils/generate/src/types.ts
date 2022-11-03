export interface Axes {
	min: number | string;
	max: number | string;
}

export interface Source {
	url: string;
	format: string;
}

export interface Variable {
	wght?: Axes;
	stretch?: Axes; // wdth
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