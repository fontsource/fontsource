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
	'id',
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
type FontsQueries = (typeof fontsQueries)[number] & keyof ArrayMetadataItem;
const isFontsQueries = (x: string): x is FontsQueries =>
	fontsQueries.includes(x as FontsQueries);

interface FontVariants {
	[weight: string]: {
		[style: string]: {
			[subset: string]: {
				url: {
					woff2: string;
					woff: string;
					ttf?: string;
					otf?: string;
				};
			};
		};
	};
}

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

export type {
	ArrayMetadata,
	ArrayMetadataItem,
	FontsQueries,
	FontVariants,
	IDResponse,
};
export { isFontsQueries };
