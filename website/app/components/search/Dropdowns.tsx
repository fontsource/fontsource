import { Dropdown } from '@components';
import { Checkbox, Menu } from '@mantine/core';
import type { PrimitiveAtom } from 'jotai';
import { atom, useAtom } from 'jotai';

import { dropdownAtomArr, filterAtom } from './atoms';

// Gives a truncated label for multiple selected items
const getLabel = (
  data: string[][],
  state: PrimitiveAtom<boolean>[],
  placeholder: string
) => {
  const checked = data.filter((_, i) => {
    const [checked] = useAtom(state[i]);
    return checked;
  });
  if (checked.length === 0) return placeholder;

  if (checked.length === 1) return checked[0][0];

  return `${checked[0][0]} + ${checked.length - 1}`;
};

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
  // We have to persist dropdown state across re-renders
  const [checkboxState] = useAtom(languageAtomArr);
  const [, setFilterItems] = useAtom(filterAtom);
  const placeholder = 'All languages';
  
  return (
    <Dropdown label={getLabel(languageData, checkboxState, placeholder)}>
      {languageData.map(([label, value], index) => (
        <DropdownItem
          label={label}
          value={value}
          valuePrefix='subsets:'
          filter={setFilterItems}
          key={value}
          state={checkboxState[index]}
        />
      ))}
    </Dropdown>
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
  // We have to persist dropdown state across re-renders
  const [checkboxState] = useAtom(categoryAtomArr);
  const [, setFilterItems] = useAtom(filterAtom);
  const placeholder = 'All categories';
  
  return (
    <Dropdown label={getLabel(categoryData, checkboxState, placeholder)}>
      {categoryData.map(([label, value], index) => (
        <DropdownItem
          label={label}
          value={value}
          valuePrefix='category:'
          filter={setFilterItems}
          key={value}
          state={checkboxState[index]}
        />
      ))}
    </Dropdown>
  );
};

export {
  CategoriesDropdown,
  categoryAtomArr,
  languageAtomArr,
  LanguagesDropdown,
};
