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
	const legacyItems = subsets.map((subset) => ({
		value: `subset:${subset}`,
		label: `${subsetToLanguage(subset)} (subset)`,
		isRefined: true,
	}));
	const labels = [
		...legacyItems,
		...languageItems.filter((item) => item.isRefined),
	].map((item) => item.label);
	return (
		<DropdownCheckbox
			label={selectionLabel(labels, 'All languages')}
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
			showCount
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

const TagsDropdown = ({ taxonomy }: Pick<SearchFacets, 'taxonomy'>) => {
	const { items, refine } = useRefinementList({
		attribute: 'tags',
		operator: 'and',
		limit: 100,
	});
	const tags = items.map((item) => ({
		...item,
		label: taxonomy.tags[item.value]
			? `${taxonomy.tagGroups[item.value.split('/')[0]]?.label ?? item.value.split('/')[0]}: ${taxonomy.tags[item.value].label}`
			: item.value,
	}));
	return (
		<DropdownCheckbox
			label={selectionLabel(
				tags.filter((item) => item.isRefined).map((item) => item.label),
				'All tags',
			)}
			showCount
			ariaLabel="Tags (match all selected)"
			items={tags}
			refine={refine}
			searchable
		/>
	);
};

export { CategoriesDropdown, LanguagesDropdown, TagsDropdown };
