import { useSelector } from '@legendapp/state/react';
import { Checkbox, Menu } from '@mantine/core';

import { Dropdown } from '@/components';
import { subsetsMap } from '@/utils/language/subsets';

import { categoriesMap, category, language } from './observables';

interface DropdownItemProps {
	label: string;
	value: string;
	currentState: string;
	setState: (value: React.SetStateAction<any>) => void;
}

const DropdownItem = ({
	label,
	value,
	currentState,
	setState,
}: DropdownItemProps) => {
	return (
		<Menu.Item
			onClick={() => {
				setState(currentState === value ? '' : value);
			}}
		>
			<Checkbox
				label={label}
				checked={currentState === value}
				readOnly
				style={{
					pointerEvents: 'none',
					display: 'flex',
				}}
			/>
		</Menu.Item>
	);
};

const LanguagesDropdown = () => {
	const subset = useSelector(language);

	const label = subset !== '' ? subsetsMap[subset] : 'All languages';
	return (
		<Dropdown label={label}>
			{Object.entries(subsetsMap).map(([key, label]) => (
				<DropdownItem
					key={key}
					label={label}
					value={key}
					currentState={subset}
					setState={language.set}
				/>
			))}
		</Dropdown>
	);
};

const CategoriesDropdown = () => {
	const categorySelect = useSelector(category);
	const label =
		categorySelect !== '' ? categoriesMap[categorySelect] : 'All categories';
	return (
		<Dropdown label={label}>
			{Object.entries(categoriesMap).map(([key, label]) => (
				<DropdownItem
					key={key}
					label={label}
					value={key}
					currentState={categorySelect}
					setState={category.set}
				/>
			))}
		</Dropdown>
	);
};

export { CategoriesDropdown, LanguagesDropdown };
