type CFRouterContext = [env: Env, ctx: ExecutionContext];

interface VariableMetadata {
	[axes: string]: {
		default: string;
		min: string;
		max: string;
		step: string;
	};
}

interface LicenseMetadata {
	type: string;
	url: string;
	attribution: string;
}

interface FontMetadata {
	id: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	variable: false | VariableMetadata;
	lastModified: string;
	category: string;
	license: LicenseMetadata;
	source: string;
	type: 'google' | 'icons' | 'other';
	version: string;
	npmVersion: string;
	unicodeRange: {
		[subset: string]: string;
	};
}

type FontsourceMetadata = Record<string, FontMetadata>;

export type { CFRouterContext, FontsourceMetadata, FontMetadata };
