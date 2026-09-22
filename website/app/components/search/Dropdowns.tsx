import { useMemo, useState } from 'react';
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

const languageCollator = new Intl.Collator('en');

const LanguagesDropdown = ({ languages }: Pick<SearchFacets, 'languages'>) => {
	const languageOptions = useMemo(
		() =>
			languages
				.map(({ id, name, preferredName, autonym }) => ({
					value: id,
					label: preferredName ?? name,
					searchFields: [name, preferredName, autonym, id].map((value) =>
						value?.toLocaleLowerCase(),
					),
				}))
				.sort((a, b) => languageCollator.compare(a.label, b.label)),
		[languages],
	);
	const [query, setQuery] = useState('');
	const { indexUiState } = useInstantSearch();
	const { refine } = useRefinementList({
		attribute: 'languageIds',
		operator: 'and',
	});
	// Keep published subset links as subset filters, rather than guessing a language.
	const legacy = useRefinementList({
		attribute: 'subsets',
		operator: 'and',
	});
	const selected = indexUiState.refinementList?.languageIds ?? [];
	const subsets = indexUiState.refinementList?.subsets ?? [];
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const languageItems = languageOptions.map(
		({ value, label, searchFields }) => ({
			value,
			label,
			isRefined: selected.includes(value),
			matches: searchFields.some((field) => field?.includes(normalizedQuery)),
		}),
	);
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
			w="100%"
			dropdownWidth="target"
			ariaLabel="Languages"
			items={[
				...legacyItems,
				...languageItems.filter((item) => item.isRefined || item.matches),
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
