import { Checkbox, Menu } from '@mantine/core';
import { atom, useAtom } from 'jotai';

import { Dropdown } from '@/components';
import { subsetsMap } from '@/utils/language/subsets';

import { filterAtom } from './atoms';

interface FilterChange {
  filter: (event: string) => void;
}
interface DropdownItemProps extends FilterChange {
  label: string;
	value: string;
	currentState: string;
	setState: (value: React.SetStateAction<any>) => void;
  valuePrefix: string;
}

const DropdownItem = ({
	label,
	value,
	valuePrefix,
	currentState,
	setState,
  filter,
}: DropdownItemProps) => {
  return (
    <Menu.Item
      onClick={() => {
        setState(currentState === value ? '' : value);
        filter(`${valuePrefix}${value}`);
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

type LanguageAtom = keyof typeof subsetsMap | '';
const languageAtom = atom<LanguageAtom>('');

const LanguagesDropdown = () => {
	const [, setFilterItems] = useAtom(filterAtom);
	const [subset, setSubset] = useAtom(languageAtom);

	const label = subset !== '' ? subsetsMap[subset] : 'All languages';
  return (
    <Dropdown label={label}>
      {Object.entries(subsetsMap).map(([key, label]) => (
				<DropdownItem
					key={key}
          label={label}
					value={key}
					currentState={subset}
					setState={setSubset}
          valuePrefix="subsets:"
          filter={setFilterItems}
        />
      ))}
    </Dropdown>
  );
};

const categoriesMap = {
	'serif': 'Serif',
	'sans-serif': 'Sans Serif',
	'display': 'Display',
	'handwriting': 'Handwriting',
	'monospace': 'Monospace',
	'icons': 'Icons',
	'other': 'Other',
}

type CategoryAtom = keyof typeof categoriesMap | '';
const categoryAtom = atom<CategoryAtom>('');

const CategoriesDropdown = () => {
  const [, setFilterItems] = useAtom(filterAtom);
	const [category, setCategory] = useAtom(categoryAtom);

	const label = category !== '' ? categoriesMap[category] : 'All categories';
  return (
		<Dropdown label={label}>
      {Object.entries(categoriesMap).map(([key, label]) => (
				<DropdownItem
					key={key}
          label={label}
					value={key}
					currentState={category}
					setState={setCategory}
          valuePrefix="category:"
          filter={setFilterItems}
        />
      ))}
    </Dropdown>
  );
};

export {
  CategoriesDropdown,
  categoryAtom,
  languageAtom,
  LanguagesDropdown,
};
