import {
	type GetRegistryTaxonomyResponse,
	getRegistryTaxonomy,
	type ListFontValuesResponse,
	type ListRegistryFamiliesResponse,
	listFontValues,
	listRegistryFamilies,
} from '@/generated/api';
import { getDiscoveryPages } from '@/utils/discovery';

const countProjection = (
	projection: ListFontValuesResponse,
): Record<string, number> => {
	const counts: Record<string, number> = {};

	for (const value of Object.values(projection)) {
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

export const loadDiscoveryData = async (signal?: AbortSignal) => {
	const [subsets, categories, variable, families, taxonomy] = await Promise.all(
		[
			listFontValues({ subsets: '' }, { signal }),
			listFontValues({ category: '' }, { signal }),
			listFontValues({ variable: '' }, { signal }),
			listRegistryFamilies({ signal }),
			getRegistryTaxonomy({ signal }),
		],
	);

	// Search indexes the published font catalog, not every registry family.
	const catalogFamilies = families.filter((family) =>
		Object.hasOwn(categories, family.id),
	);
	const counts = {
		subsets: countProjection(subsets),
		categories: countProjection(categories),
		variable: countProjection(variable).true ?? 0,
		classifications: countProjection(
			Object.fromEntries(
				catalogFamilies.map((family) => [family.id, family.classifications]),
			),
		),
		tags: countProjection(
			Object.fromEntries(
				catalogFamilies.map((family) => [family.id, family.tags]),
			),
		),
	};
	return {
		pages: getDiscoveryPages(counts, taxonomy),
		registry: { families, taxonomy },
	};
};
