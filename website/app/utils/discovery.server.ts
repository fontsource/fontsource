import {
	type GetRegistryTaxonomyResponse,
	getRegistryTaxonomy,
	type ListFontValuesResponse,
	type ListRegistryFamiliesResponse,
	listFontValues,
	listRegistryFamilies,
} from '@/generated/api';
import { getDiscoveryPages } from '@/utils/discovery';

const countValues = (
	familyValues: ListFontValuesResponse[string][],
): Record<string, number> => {
	const counts: Record<string, number> = {};

	for (const value of familyValues) {
		const values = new Set(
			(Array.isArray(value) ? value : [value]).map((item) => String(item)),
		);
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
	pathname?: string,
) => {
	// Browse and the sitemap need every projection; a landing page only needs its own.
	const [subsets, categories, variable, families, taxonomy] = await Promise.all(
		[
			!pathname || pathname.startsWith('/languages/')
				? listFontValues({ subsets: '' }, { signal })
				: {},
			listFontValues({ category: '' }, { signal }),
			!pathname || pathname === '/variable-fonts'
				? listFontValues({ variable: '' }, { signal })
				: {},
			listRegistryFamilies({ signal }),
			getRegistryTaxonomy({ signal }),
		],
	);

	// Search indexes the published font catalog, not every registry family.
	const catalogFamilies = families.filter((family) =>
		Object.hasOwn(categories, family.id),
	);
	const counts = {
		subsets: countValues(Object.values(subsets)),
		categories: countValues(Object.values(categories)),
		variable: countValues(Object.values(variable)).true ?? 0,
		classifications: countValues(
			catalogFamilies.map((family) => family.classifications),
		),
		tags: countValues(catalogFamilies.map((family) => family.tags)),
	};
	return {
		pages: getDiscoveryPages(counts, taxonomy),
		registry: { families, taxonomy },
	};
};
