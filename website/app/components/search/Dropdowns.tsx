
import { Dropdown } from '@components';
import {
  Checkbox,
  Menu,
} from '@mantine/core';
import type { PrimitiveAtom } from 'jotai';
import { atom, useAtom } from 'jotai';

import type { DropdownState } from './atoms';
import { dropdownAtomArr, filterAtom } from './atoms';

interface FilterChange {
  filter: (event: string) => void;
}
interface DropdownItemProps extends FilterChange {
  label: string;
  value: string;
  valuePrefix: string;
  state: PrimitiveAtom<boolean>;
}

const DropdownItem = ({
  label,
  value,
  valuePrefix,
  filter,
  state,
}: DropdownItemProps) => {
  const [checked, setChecked] = useAtom(state);
  return (
    <Menu.Item>
      <Checkbox
        label={label}
        value={`${valuePrefix}${value}`}
        checked={checked}
        onChange={(event) => {
          setChecked(!checked);
          filter(event.target.value);
        }}
      />
    </Menu.Item>
  );
};

interface DropdownProps {
  data: string[][];
  placeholder: string;
  // Algolia filter prefixes
  valuePrefix: string;
  checkboxAtom: PrimitiveAtom<DropdownState>;
}

const DropdownWrapper = ({
  data,
  placeholder,
  valuePrefix,
  checkboxAtom,
}: DropdownProps) => {
  // We have to persist dropdown state across re-renders
  const [checkboxState] = useAtom(checkboxAtom);
  const [, setFilterItems] = useAtom(filterAtom); 
  return (
    <Dropdown label={placeholder}>
          {data.map(([label, value], index) => (
            <DropdownItem
              label={label}
              value={value}
              valuePrefix={valuePrefix}
              filter={setFilterItems}
              key={value}
              state={checkboxState[index]}
            />
          ))}
    </Dropdown>
  );
};

const languageData: [string, string][] = [
  ['Arabic', 'arabic'],
  ['Bengali', 'bengali'],
  ['Chinese (Hong Kong)', 'chinese-hongkong'],
  ['Chinese (Simplified)', 'chinese-simplified'],
  ['Chinese (Traditional)', 'chinese-traditional'],
  ['Cyrillic', 'cyrillic'],
  ['Cyrillic Extended', 'cyrillic-ext'],
  ['Devanagari', 'devanagari'],
  ['Greek', 'greek'],
  ['Greek Extended', 'greek-ext'],
  ['Gujarati', 'gujarati'],
  ['Gurmukhi', 'gurmukhi'],
  ['Hebrew', 'hebrew'],
  ['Japanese', 'japanese'],
  ['Kannada', 'kannada'],
  ['Khmer', 'khmer'],
  ['Korean', 'korean'],
  ['Latin', 'latin'],
  ['Latin Extended', 'latin-ext'],
  ['Malayalam', 'malayalam'],
  ['Myanmar', 'myanmar'],
  ['Oriya', 'oriya'],
  ['Sinhala', 'sinhala'],
  ['Tamil', 'tamil'],
  ['Telugu', 'telugu'],
  ['Thai', 'thai'],
  ['Tibetan', 'tibetan'],
  ['Vietnamese', 'vietnamese'],
];
const languageAtomArr = atom(dropdownAtomArr(languageData.length));

const LanguagesDropdown = () => {
  return (
    <DropdownWrapper
      checkboxAtom={languageAtomArr}
      data={languageData}
      placeholder="All languages"
      valuePrefix="subsets:"
    />
  );
};

const categoryData: [string, string][] = [
  ['Serif', 'serif'],
  ['Sans Serif', 'sans-serif'],
  ['Display', 'display'],
  ['Handwriting', 'handwriting'],
  ['Monospace', 'monospace'],
  ['Other', 'other'],
];
const categoryAtomArr = atom(dropdownAtomArr(categoryData.length));

const CategoriesDropdown = () => {
  return (
    <DropdownWrapper
      checkboxAtom={categoryAtomArr}
      data={categoryData}
      placeholder="All categories"
      valuePrefix="category:"
    />
  );
};

export {
  CategoriesDropdown,
  categoryAtomArr,
  languageAtomArr,
  LanguagesDropdown,
};
