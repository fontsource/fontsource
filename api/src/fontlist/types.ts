import { FontMetadata } from '@/types';

const fontlistQueries = [
	'subsets',
	'weights',
	'styles',
	'variable',
	'lastModified',
	'category',
	'version',
	'type',
] as const;
type FontlistQueries = typeof fontlistQueries[number] & keyof FontMetadata;
const isFontlistQuery = (query: string): query is FontlistQueries =>
	fontlistQueries.includes(query as FontlistQueries);

interface Fontlist {
	[key: string]: string | string[] | number[] | boolean;
}

export { isFontlistQuery };
export type { FontlistQueries, Fontlist };
