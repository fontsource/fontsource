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
	legacyFamilyIds: string[] = [],
) =>
	createLanguageSearchClient(
		{ search } as unknown as SearchClient,
		index,
		legacyFamilyIds,
	);

describe('complete language facets', () => {
	it('counts all languages, including beyond the facet cap, using complete hits without extra requests', async () => {
		const languages = Object.fromEntries(
			Array.from({ length: 1700 }, (_, i) => [`language-${i}`, 'Aw==']),
		);
		const search = vi
			.fn()
			.mockResolvedValue({ results: [response(['a', 'b', 'c'])] });
		const result = await clientWith(search, {
			...languageIndex,
			languages: { ...languages, ...languageIndex.languages },
		}).search(request());
		expect(result.results[0]).toMatchObject({
			facets: {
				languageIds: {
					en_Latn: 2,
					peo_Xpeo: 1,
					missing: 0,
					'language-1699': 2,
				},
				classifications: { serif: 2 },
			},
		});
		expect(search).toHaveBeenCalledTimes(1);
	});

	it('includes catalog-only fonts in bounded queries without adding language counts', async () => {
		const families = Array.from({ length: 1001 }, (_, i) => `font-${i}`);
		const bits = Buffer.alloc(Math.ceil(families.length / 8));
		bits.fill(255);
		bits[bits.length - 1] = 1;
		const search = vi
			.fn()
			.mockResolvedValueOnce({
				results: [response(families.slice(0, 20), families.length + 1)],
			})
			.mockResolvedValueOnce({
				results: [
					response(families.slice(0, 500)),
					response(families.slice(500, 1000)),
					response([...families.slice(1000), 'legacy-font']),
				],
			});
		const params = {
			query: 'serif',
			page: 3,
			filters: '(objectID:"font-0" OR objectID:"font-1000")',
			facetFilters: [
				'languageIds:en_Latn',
				'subsets:latin',
				['classifications:serif', 'classifications:display'],
				'variable:true',
			],
		};
		const result = await clientWith(
			search,
			{
				version: languageIndex.version,
				families,
				languages: { en_Latn: bits.toString('base64') },
			},
			['legacy-font'],
		).search(request(params));
		expect(result.results[0]).toMatchObject({
			facets: { languageIds: { en_Latn: 1001 } },
		});
		const batches = search.mock.calls[1][0];
		expect(batches).toHaveLength(3);
		expect(batches[2].params.filters).toContain('objectID:"legacy-font"');
		for (const batch of batches) {
			expect(batch).toMatchObject({
				indexName: 'prod_POPULAR',
				params: {
					query: params.query,
					facetFilters: params.facetFilters,
					page: 0,
					hitsPerPage: 500,
					facets: [],
					attributesToRetrieve: ['objectID', 'languageIndexVersion'],
					analytics: false,
					clickAnalytics: false,
					removeWordsIfNoResults: 'none',
				},
			});
			expect(batch.params.filters).toContain(`(${params.filters}) AND (`);
		}
	});

	it('fetches smaller match sets in one query without adding partition filters', async () => {
		const search = vi
			.fn()
			.mockResolvedValueOnce({ results: [response(['a'], 3)] })
			.mockResolvedValueOnce({ results: [response(['a', 'b', 'c'])] });
		const params = { query: 'font', filters: 'variable:true' };
		const result = await clientWith(search).search(request(params));
		expect(result.results[0]).toMatchObject({
			facets: { languageIds: { en_Latn: 2, peo_Xpeo: 1 } },
		});
		expect(search.mock.calls[1][0]).toEqual([
			expect.objectContaining({
				params: expect.objectContaining({ ...params, hitsPerPage: 1000 }),
			}),
		]);
	});

	it('counts complete filtered hits containing catalog-only fonts', async () => {
		const search = vi
			.fn()
			.mockResolvedValue({ results: [response(['a', 'legacy-font'])] });
		const result = await clientWith(search, languageIndex, [
			'legacy-font',
		]).search(request());
		expect(result.results[0]).toMatchObject({
			facets: { languageIds: { en_Latn: 1, peo_Xpeo: 0 } },
		});
		expect(search).toHaveBeenCalledOnce();
	});

	it('does not invent zeros when registry IDs cannot account for all search results', async () => {
		const original = response(['a'], 4);
		const search = vi
			.fn()
			.mockResolvedValueOnce({ results: [original] })
			.mockResolvedValueOnce({ results: [response(['a', 'b', 'c'])] });
		expect((await clientWith(search).search(request())).results[0]).toEqual(
			original,
		);
	});

	it('preserves search when supplementary counts fail or matching is approximate', async () => {
		const original = response(['a'], 3);
		const search = vi
			.fn()
			.mockResolvedValueOnce({ results: [original] })
			.mockRejectedValueOnce(new Error('offline'));
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
		try {
			expect((await clientWith(search).search(request())).results[0]).toEqual(
				original,
			);
			expect(warning).toHaveBeenCalledOnce();
		} finally {
			warning.mockRestore();
		}
		for (const extra of [
			{ exhaustiveNbHits: false },
			{ queryAfterRemoval: 'old <em>persian</em>' },
		]) {
			const approximate = { ...original, ...extra };
			const search = vi.fn().mockResolvedValue({ results: [approximate] });
			expect((await clientWith(search).search(request())).results[0]).toEqual(
				approximate,
			);
			expect(search).toHaveBeenCalledOnce();
		}
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
			expect(search).toHaveBeenCalledOnce();
		}
		const partial = response(['a'], 2);
		const search = vi
			.fn()
			.mockResolvedValueOnce({ results: [partial] })
			.mockResolvedValueOnce({
				results: [
					{
						...response(['a', 'b']),
						hits: [
							{ objectID: 'a', languageIndexVersion: 'b'.repeat(64) },
							{ objectID: 'b', languageIndexVersion: languageIndex.version },
						],
					},
				],
			});
		expect((await clientWith(search).search(request())).results[0]).toEqual(
			partial,
		);
	});

	it('preserves results with unknown font IDs and non-language searches', async () => {
		const original = response(['new-font']);
		const search = vi.fn().mockResolvedValue({ results: [original] });
		expect((await clientWith(search).search(request())).results[0]).toEqual(
			original,
		);
		expect(
			(
				await clientWith(search).search(
					request({ facets: ['classifications'] }),
				)
			).results[0],
		).toEqual(original);
		expect(search).toHaveBeenCalledTimes(2);
	});
});
