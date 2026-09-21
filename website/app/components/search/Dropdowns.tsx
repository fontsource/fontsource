import { useState } from 'react';
import {
	useInstantSearch,
	useMenu,
	useRefinementList,
} from 'react-instantsearch';

import { DropdownCheckbox } from '@/components/Dropdown';
import type {
	GetRegistryTaxonomyResponse,
	ListRegistryLanguagesResponse,
} from '@/generated/api';
import { subsetToLanguage } from '@/utils/language/subsets';

export interface SearchFacets {
	languages: ListRegistryLanguagesResponse;
	taxonomy: GetRegistryTaxonomyResponse;
}

const selectionLabel = (labels: string[], fallback: string) =>
	labels.length > 1
		? `${labels[0]} + ${labels.length - 1}`
		: (labels[0] ?? fallback);

const LanguagesDropdown = ({ languages }: Pick<SearchFacets, 'languages'>) => {
	const [query, setQuery] = useState('');
	const { indexUiState, results } = useInstantSearch();
	const { refine, hasExhaustiveItems } = useRefinementList({
		attribute: 'languageIds',
		operator: 'and',
		limit: 1000,
	});
	// Keep published subset links as subset filters, rather than guessing a language.
	const legacy = useRefinementList({
		attribute: 'subsets',
		operator: 'and',
		limit: 100,
	});
	const selected = indexUiState.refinementList?.languageIds ?? [];
	const subsets = indexUiState.refinementList?.subsets ?? [];
	const counts = new Map<string, number>(
		Object.entries(
			results.facets.find((facet) => facet.name === 'languageIds')?.data ?? {},
		),
	);
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const languageItems = languages.map((language) => ({
		value: language.id,
		label: language.preferredName ?? language.name,
		isRefined: selected.includes(language.id),
		// Missing values are only zero when Algolia returned the complete facet list.
		count: counts.get(language.id) ?? (hasExhaustiveItems ? 0 : undefined),
		matches: [
			language.name,
			language.preferredName,
			language.autonym,
			language.id,
		].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
	}));
	languageItems.sort((a, b) => a.label.localeCompare(b.label, 'en'));
	const legacyItems = subsets.map((subset) => ({
		value: `subset:${subset}`,
		label: `${subsetToLanguage(subset)} (subset)`,
		isRefined: true,
	}));
	const selectedItems = languageItems.filter((item) => item.isRefined);
	const labels = [...legacyItems, ...selectedItems].map((item) => item.label);
	return (
		<DropdownCheckbox
			label={selectionLabel(labels, 'All languages')}
			showCount
			w="100%"
			dropdownWidth="target"
			ariaLabel="Languages"
			items={[
				...legacyItems,
				...languageItems.filter(
					(item) => item.isRefined || (item.matches && item.count !== 0),
				),
			]}
			refine={(value) =>
				value.startsWith('subset:')
					? legacy.refine(value.slice(7))
					: refine(value)
			}
			search={setQuery}
		/>
	);
};

const CategoriesDropdown = ({ taxonomy }: Pick<SearchFacets, 'taxonomy'>) => {
	const { indexUiState } = useInstantSearch();
	const legacy = useMenu({ attribute: 'category' });
	const { items, refine } = useRefinementList({
		attribute: 'classifications',
		operator: 'or',
		limit: 20,
	});
	const labels: Record<string, { label: string }> = taxonomy.classifications;
	const categories: {
		value: string;
		label: string;
		isRefined: boolean;
		count?: number;
	}[] = items.map((item) => ({
		...item,
		label: labels[item.value]?.label ?? item.value,
	}));
	const legacyCategory = indexUiState.menu?.category;
	if (legacyCategory)
		categories.unshift({
			value: `category:${legacyCategory}`,
			label: `${legacyCategory} (legacy category)`,
			isRefined: true,
		});
	return (
		<DropdownCheckbox
			label={selectionLabel(
				categories.filter((item) => item.isRefined).map((item) => item.label),
				'All categories',
			)}
			showCount
			w="100%"
			dropdownWidth="target"
			ariaLabel="Categories"
			items={categories}
			refine={(value) =>
				value.startsWith('category:')
					? legacy.refine(value.slice(9))
					: refine(value)
			}
		/>
	);
};

export { CategoriesDropdown, LanguagesDropdown };
