import { type IDResponse } from 'common-api/types';

import type { FontMetadata } from '../types';

const fontlistQueries = [
	'family',
	'subsets',
	'weights',
	'styles',
	'variable',
	'lastModified',
	'category',
	'version',
	'type',
] as const;
type FontlistQueries = (typeof fontlistQueries)[number] & keyof FontMetadata;
const isFontlistQuery = (query: string): query is FontlistQueries =>
	fontlistQueries.includes(query as FontlistQueries);

type Fontlist = Record<string, string | string[] | number[] | boolean>;

type MetadataList = Record<string, IDResponse>;

export { fontlistQueries, isFontlistQuery };
export type { Fontlist, FontlistQueries, MetadataList };
