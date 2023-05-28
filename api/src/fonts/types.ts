interface ArrayMetadataItem {
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
}

type ArrayMetadata = ArrayMetadataItem[];

const fontsQueries = [
	'family',
	'subsets',
	'weights',
	'styles',
	'defSubset',
	'variable',
	'lastModified',
	'category',
	'license',
	'type',
] as const;
type FontsQueries = typeof fontsQueries[number] & keyof ArrayMetadataItem;
const isFontsQueries = (x: string): x is FontsQueries =>
	fontsQueries.includes(x as FontsQueries);

export type { ArrayMetadataItem, ArrayMetadata, FontsQueries };
export { isFontsQueries };
