import type { SearchClient, SearchOptions } from 'instantsearch.js';
import { describe, expect, it, vi } from 'vitest';

import type { GetRegistryLanguageIndexResponse } from '@/generated/api';
import { createLanguageSearchClient } from './language-facets';

const response = (ids: string[], nbHits = ids.length) => ({
	hits: ids.map((objectID) => ({
		objectID,
		languageIndexVersion: 'a'.repeat(64),
	})),
	nbHits,
	nbPages: 1,
	page: 0,
	hitsPerPage: 20,
	processingTimeMS: 0,
	query: '',
	exhaustiveNbHits: true,
	facets: { languageIds: { en_Latn: 2 }, classifications: { serif: 2 } },
});
const request = (params: SearchOptions = {}) => [
	{
		indexName: 'prod_POPULAR',
		params: { facets: ['languageIds'], ...params },
	},
];

const languageIndex = {
	version: 'a'.repeat(64),
	families: ['a', 'b', 'c'],
	languages: { en_Latn: 'Aw==', peo_Xpeo: 'BA==', missing: 'AA==' },
};

const clientWith = (
	search: ReturnType<typeof vi.fn>,
	index: GetRegistryLanguageIndexResponse = languageIndex,
) => createLanguageSearchClient({ search } as unknown as SearchClient, index);

describe('complete language facets', () => {
	it('counts all matches beyond the provider result cap', async () => {
		const families = Array.from({ length: 1001 }, (_, i) => `font-${i}`);
		const bits = Buffer.alloc(Math.ceil(families.length / 8), 255);
		bits[bits.length - 1] = 1;
		const search = vi
			.fn()
			.mockResolvedValueOnce({
				results: [response(families.slice(0, 20), families.length)],
			})
			.mockResolvedValueOnce({
				results: [
					response(families.slice(0, 500)),
					response(families.slice(500, 1000)),
					response(families.slice(1000)),
				],
			});
		const result = await clientWith(search, {
			version: languageIndex.version,
			families,
			languages: { en_Latn: bits.toString('base64') },
		}).search(request());
		expect(result.results[0]).toMatchObject({
			facets: { languageIds: { en_Latn: 1001 } },
		});
	});

	it('does not combine registry and search language data from different versions', async () => {
		const original = response(['a']);
		for (const version of [undefined, 'b'.repeat(64)]) {
			const stale = {
				...original,
				hits: [{ objectID: 'a', languageIndexVersion: version }],
			};
			const search = vi.fn().mockResolvedValue({ results: [stale] });
			expect((await clientWith(search).search(request())).results[0]).toEqual(
				stale,
			);
		}
	});
});
