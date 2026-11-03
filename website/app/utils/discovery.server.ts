import {
	type GetRegistryTaxonomyResponse,
	getRegistryTaxonomy,
	type ListRegistryFamiliesResponse,
	listPublishedPackages,
	listRegistryFamilies,
} from '@/generated/api';
import { DEFAULT_SEARCH_INDEX, searchClient } from '@/utils/algolia-client';
import { getDiscoveryPages } from '@/utils/discovery';

const countValues = (familyValues: string[][]): Record<string, number> => {
	const counts: Record<string, number> = {};

	for (const value of familyValues) {
		const values = new Set(value);
		for (const item of values) {
			counts[item] = (counts[item] ?? 0) + 1;
		}
	}

	return counts;
};

export type DiscoveryRegistry = {
	families: ListRegistryFamiliesResponse;
	taxonomy: GetRegistryTaxonomyResponse;
};

export const loadDiscoveryData = async (
	signal?: AbortSignal,
	_pathname?: string,
) => {
	// Reuse search facets for shipped subset routes; registry describes source coverage.
	const [published, families, taxonomy, search] = await Promise.all([
		listPublishedPackages({ signal }),
		listRegistryFamilies(undefined, { signal }),
		getRegistryTaxonomy(undefined, { signal }),
		searchClient.searchForHits({
			requests: [
				{
					indexName: DEFAULT_SEARCH_INDEX,
					hitsPerPage: 0,
					facets: ['subsets', 'category'],
					maxValuesPerFacet: 1000,
				},
			],
		}),
	]);
	const catalogFamilies = families.filter((family) =>
		Object.hasOwn(published, family.id),
	);
	const facets = search.results[0].facets ?? {};

	const counts = {
		subsets: facets.subsets ?? {},
		categories: facets.category ?? {},
		variable: catalogFamilies.filter((family) => published[family.id].variable)
			.length,
		classifications: countValues(
			catalogFamilies.map((family) => family.classifications),
		),
		tags: countValues(catalogFamilies.map((family) => family.tags)),
	};
	return {
		pages: getDiscoveryPages(counts, taxonomy),
		catalogFamilies,
		registry: { families, taxonomy },
	};
};
