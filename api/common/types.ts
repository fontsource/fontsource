type FontVariants = Record<
	string,
	Record<
		string,
		Record<
			string,
			{
				url: {
					woff2: string;
					woff: string;
					ttf?: string;
					otf?: string;
				};
			}
		>
	>
>;

interface IDResponse {
	id: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	variable: boolean;
	lastModified: string;
	category: string;
	license: string;
	type: string;
	unicodeRange: Record<string, string>;
	variants: FontVariants;
}

interface StatusErrorObject {
	status: number;
	error: string;
}

interface VersionResponse {
	latest: string;
	static: string[];
	latestVariable?: string;
	variable?: string[];
}

interface AxesData {
	default: string;
	min: string;
	max: string;
	step: string;
}

// axes: italic: link
interface VariableVariants {
	[axes: string]: {
		[style: string]: {
			[subset: string]: string;
		};
	};
}

interface VariableMetadata {
	family: string;
	axes: Record<string, AxesData>;
}

interface VariableMetadataWithVariants extends VariableMetadata {
	variants: VariableVariants;
}

export type {
	FontVariants,
	IDResponse,
	StatusErrorObject,
	VersionResponse,
	VariableVariants,
	VariableMetadata,
	VariableMetadataWithVariants,
};
