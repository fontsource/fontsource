export interface FontList {
	[key: string]: string;
}

export const FONT_DIRS = [
	'google',
	'variable',
	'icons',
	'variable-icons',
	'other',
] as const;
export type FontDirectory = (typeof FONT_DIRS)[number];

export interface LicenseData {
	type: string;
	attribution: string;
	url: string;
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
	license: LicenseData;
	type: 'google' | 'other';
	unicodeRange: UnicodeData;
}

export interface UnicodeData {
	[key: string]: string;
}

export interface VariableData {
	family: string;
	id: string;
	axes: Record<string, AxesData>;
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

interface StatsResponse {
	npmDownloadTotal: number;
	npmDownloadMonthly: number;
	jsDelivrHitsTotal: number;
	jsDelivrHitsMonthly: number;
}

export interface StatsResponseAll {
	total: StatsResponse;
	static: StatsResponse;
	variable?: StatsResponse;
}

export interface PackageJson {
	version: string;
}

export interface AlgoliaMetadata {
	objectID: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	defSubset: string;
	category: string;
	variable: boolean;
	lastModified: number;
	downloadMonth: number;
	randomIndex: number;
}
