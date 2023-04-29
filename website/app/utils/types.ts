export interface FontList {
	[key: string]: string;
}

export const METADATA_TYPES = ['google', 'variable', 'icons', 'other'] as const;
export type MetadataType = typeof METADATA_TYPES[number];
export const isMetadataType = (type: string): type is MetadataType =>
	METADATA_TYPES.includes(type as MetadataType);
export interface DownloadMetadata {
	id: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	variable: false | VariableData;
	lastModified: string;
	version: string;
	category: string;
	source: string;
	license: string;
	type: MetadataType;
}

export interface UnicodeData {
	[key: string]: string;
}

export interface VariableData {
	[key: string]: AxesData;
}

export interface AxesData {
	default: string;
	min: string;
	max: string;
	step: string;
}

export interface AxisRegistry {
	name: string;
	tag: string;
	description: string;
	default: number;
	min: number;
	max: number;
	precision: number;
}

export type AxisRegistryAll = Record<string, Omit<AxisRegistry, 'tag'>>;

export interface PackageJson {
	version: string;
}

export interface AlgoliaMetadata {
	objectID: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	category: string;
	variable: boolean;
	lastModified: number;
	downloadMonth: number;
	randomIndex: number;
}

export interface Metadata {
	id: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	variable: boolean;
	lastModified: string;
	version: string;
	category: string;
	source: string;
	license: string;
	type: string;
}
