interface AxisOptions {
	default: string;
	min: string;
	max: string;
	step: string;
}

export type Axes = Record<string, AxisOptions>;

type VariableMetadata = boolean | Axes;

const CATEGORY_NAMES = [
	'sans-serif',
	'serif',
	'display',
	'handwriting',
	'monospace',
	'icons',
	'other',
] as const;
export type CategoryNames = (typeof CATEGORY_NAMES)[number];
export const isCategoryName = (value: string): value is CategoryNames =>
	CATEGORY_NAMES.includes(value as CategoryNames);

type TypeNames = 'google' | 'league' | 'icons' | 'other';

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
export type UnicodeRange = Record<string, string>;
