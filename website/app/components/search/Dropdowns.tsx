import { type MenuItem } from 'instantsearch.js/es/connectors/menu/connectMenu';
import { useMenu, useRefinementList } from 'react-instantsearch';

import { DropdownCheckbox } from '@/components/Dropdown';
import { subsetToLanguage } from '@/utils/language/subsets';

const categoriesMap: Record<string, string> = {
	serif: 'Serif',
	'sans-serif': 'Sans Serif',
	display: 'Display',
	handwriting: 'Handwriting',
	monospace: 'Monospace',
	icons: 'Icons',
	other: 'Other',
};

const transformSubsets = (items: MenuItem[]): MenuItem[] => {
	return items.map((item) => ({
		...item,
		label: subsetToLanguage(item.label),
	}));
};

const transformCategories = (items: MenuItem[]): MenuItem[] => {
	return items.map((item) => ({
		...item,
		label: categoriesMap[String(item.label)] ?? item.label,
	}));
};

const LanguagesDropdown = () => {
	const { items, refine } = useRefinementList({
		attribute: 'subsets',
		operator: 'and',
		sortBy: ['name:asc'],
		limit: 100,
		transformItems: transformSubsets,
	});

	const label = items.find((item) => item.isRefined)?.label ?? 'All languages';

	return <DropdownCheckbox label={label} items={items} refine={refine} />;
};

const CategoriesDropdown = () => {
	const { items, refine } = useMenu({
		attribute: 'category',
		sortBy: ['name:asc'],
		limit: 20,
		transformItems: transformCategories,
	});

	const label = items.find((item) => item.isRefined)?.label ?? 'All categories';

	return <DropdownCheckbox label={label} items={items} refine={refine} />;
};

export { CategoriesDropdown, LanguagesDropdown };
