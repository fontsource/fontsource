import { type ListFontValuesResponse, listFontValues } from '@/generated/api';
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

const loadDiscoveryCounts = async (signal?: AbortSignal) => {
	const [subsets, categories, variable] = await Promise.all([
		listFontValues({ subsets: '' }, { signal }),
		listFontValues({ category: '' }, { signal }),
		listFontValues({ variable: '' }, { signal }),
	]);

	return {
		subsets: countProjection(subsets),
		categories: countProjection(categories),
		variable: countProjection(variable).true ?? 0,
	};
};

export const loadDiscoveryPages = async (signal?: AbortSignal) =>
	getDiscoveryPages(await loadDiscoveryCounts(signal));
