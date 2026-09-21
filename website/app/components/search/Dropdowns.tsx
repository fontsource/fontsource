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

// A curated starting order; coverage counts favor small alphabets, not popularity.
const commonLanguages = new Map(
	[
		'en_Latn',
		'es_Latn',
		'fr_Latn',
		'de_Latn',
		'pt_Latn',
		'zh_Hans',
		'zh_Hant',
		'ja_Jpan',
		'ko_Kore',
		'ar_Arab',
		'hi_Deva',
		'ru_Cyrl',
	].map((id, index) => [id, index]),
);

const selectionLabel = (labels: string[], fallback: string) =>
	labels.length > 1
		? `${labels[0]} + ${labels.length - 1}`
		: (labels[0] ?? fallback);

const LanguagesDropdown = ({ languages }: Pick<SearchFacets, 'languages'>) => {
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
		limit: 100,
	});
	const selected = indexUiState.refinementList?.languageIds ?? [];
	const subsets = indexUiState.refinementList?.subsets ?? [];
	const normalizedQuery = query.trim().toLocaleLowerCase();
	const languageItems = languages.map((language) => ({
		value: language.id,
		label: language.preferredName ?? language.name,
		isRefined: selected.includes(language.id),
		matches: [
			language.name,
			language.preferredName,
			language.autonym,
			language.id,
		].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
	}));
	languageItems.sort(
		(a, b) =>
			(commonLanguages.get(a.value) ?? commonLanguages.size) -
				(commonLanguages.get(b.value) ?? commonLanguages.size) ||
			a.label.localeCompare(b.label),
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
			label={selectionLabel(labels, 'Search all languages')}
			w="100%"
			dropdownWidth={250}
			ariaLabel="Languages"
			items={[
				...legacyItems,
				...selectedItems,
				// Search the full dictionary, but only render a small result list.
				...languageItems
					.filter((item) => !item.isRefined && item.matches)
					.slice(0, 50),
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
			dropdownWidth={250}
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
