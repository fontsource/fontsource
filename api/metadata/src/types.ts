type CFRouterContext = [env: Env, ctx: ExecutionContext];

interface AxesMetadata {
	default: string;
	min: string;
	max: string;
	step: string;
}

type VariableMetadata = Record<string, AxesMetadata>;

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
	unicodeRange: Record<string, string>;
}

type FontsourceMetadata = Record<string, FontMetadata>;

type MetadataResponse = Record<string, Omit<FontMetadata, 'npmVersion'>>;

export type {
	CFRouterContext,
	FontMetadata,
	FontsourceMetadata,
	MetadataResponse,
};
