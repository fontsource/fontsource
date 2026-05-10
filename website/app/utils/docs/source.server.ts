import { docs } from 'collections/server';
import type { SortedResult } from 'fumadocs-core/search';
import { createFromSource } from 'fumadocs-core/search/server';
import { llms, loader } from 'fumadocs-core/source';
import type { SerializedPageTree } from 'fumadocs-core/source/client';

export const source = loader({
	baseUrl: '/docs',
	source: docs.toFumadocsSource(),
});

const docsSearch = createFromSource(source);
const cacheDocsData = import.meta.env.PROD;
let serializedPageTree: Promise<SerializedPageTree> | undefined;
let docsLLMsIndex: string | undefined;

export const getSerializedPageTree = () => {
	if (!cacheDocsData) return source.serializePageTree(source.pageTree);

	serializedPageTree ??= source.serializePageTree(source.pageTree);
	return serializedPageTree;
};

export const searchDocs = (
	query: string,
	limit: number,
): Promise<SortedResult[]> => docsSearch.search(query, { limit });

const docsLLMs = llms(source);

export const getDocsLLMsIndex = () => {
	if (!cacheDocsData) return docsLLMs.index();

	docsLLMsIndex ??= docsLLMs.index();
	return docsLLMsIndex;
};
