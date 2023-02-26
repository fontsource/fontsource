export interface CLIOptions {
	test?: boolean;
	out?: string;
}

export interface BuildOptions {
	dir: string;
	tmpDir: string;
	force: boolean;
	isVariable: boolean;
}

interface Axes {
	[axesType: string]: {
		default: string;
		min: string;
		max: string;
		step: string;
	};
}

export type VariableMetadata = boolean | Axes;

export type CategoryNames =
	| 'sans-serif'
	| 'serif'
	| 'display'
	| 'handwriting'
	| 'monospace'
	| 'icons'
	| 'other';

export type TypeNames = 'google' | 'league' | 'icons' | 'other';

export interface Metadata {
	id: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	variable: VariableMetadata;
	lastModified: string;
	version: string;
	category: CategoryNames;
	license: {
		type: string;
		url: string;
		attribution: string;
	};
	source: string;
	type: TypeNames;
}
