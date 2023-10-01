import { useSelector } from '@legendapp/state/react';

import { DropdownCheckbox } from '@/components/Dropdown';
import { subsetsMap } from '@/utils/language/subsets';

import { categoriesMap, category, language } from './observables';

const LanguagesDropdown = () => {
	const subset = useSelector(language);

	const label = subset === '' ? 'All languages' : subsetsMap[subset];
	const items = Object.entries(subsetsMap).map(([key, label]) => ({
		label,
		value: key,
	}));

	return (
		<DropdownCheckbox
			label={label}
			items={items}
			currentState={subset}
			selector={language}
		/>
	);
};

const CategoriesDropdown = () => {
	const categorySelect = useSelector(category);
	const label =
		categorySelect === '' ? 'All categories' : categoriesMap[categorySelect];
	const items = Object.entries(categoriesMap).map(([key, label]) => ({
		label,
		value: key,
	}));

	return (
		<DropdownCheckbox
			label={label}
			items={items}
			currentState={categorySelect}
			selector={category}
		/>
	);
};

export { CategoriesDropdown, LanguagesDropdown };
