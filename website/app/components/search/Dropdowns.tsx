import { IconCaret } from "@components";
import {
  Button,
  Checkbox,
  createStyles,
  Menu,
  ScrollArea,
} from "@mantine/core";
import type { PrimitiveAtom } from "jotai";
import { atom, useAtom } from "jotai";

import type { DropdownState } from "./atoms";
import { dropdownAtomArr, filterAtom } from "./atoms";

const useStyles = createStyles(theme => ({
  button: {
    padding: "2px 16px",
    height: "40px",
    width: "240px",
    border: `1px solid ${
      theme.colorScheme === "dark"
        ? theme.colors.border[1]
        : theme.colors.border[0]
    }`,
    borderRadius: "4px",

    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.background[2]
        : theme.colors.background[0],

    color:
      theme.colorScheme === "dark"
        ? theme.colors.text[0]
        : theme.colors.text[1],

    fontWeight: 400,

    "&:hover": {
      backgroundColor: theme.colors.purpleHover[0],
    },
  },
}));

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
        onChange={event => {
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

const Dropdown = ({
  data,
  placeholder,
  valuePrefix,
  checkboxAtom,
}: DropdownProps) => {
  const { classes } = useStyles();
  // We have to persist dropdown state across re-renders
  const [checkboxState] = useAtom(checkboxAtom);
  const [, setFilterItems] = useAtom(filterAtom);

  return (
    <Menu shadow="md" width={240} closeOnItemClick={false}>
      <Menu.Target>
        <Button
          className={classes.button}
          rightIcon={<IconCaret />}
          styles={{
            inner: {
              justifyContent: "space-between",
            },
          }}
        >
          {placeholder}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <ScrollArea style={{ height: "240px" }}>
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
        </ScrollArea>
      </Menu.Dropdown>
    </Menu>
  );
};

const languageData: [string, string][] = [
  ["Arabic", "arabic"],
  ["Bengali", "bengali"],
  ["Chinese (Hong Kong)", "chinese-hongkong"],
  ["Chinese (Simplified)", "chinese-simplified"],
  ["Chinese (Traditional)", "chinese-traditional"],
  ["Cyrillic", "cyrillic"],
  ["Cyrillic Extended", "cyrillic-ext"],
  ["Devanagari", "devanagari"],
  ["Greek", "greek"],
  ["Greek Extended", "greek-ext"],
  ["Gujarati", "gujarati"],
  ["Gurmukhi", "gurmukhi"],
  ["Hebrew", "hebrew"],
  ["Japanese", "japanese"],
  ["Kannada", "kannada"],
  ["Khmer", "khmer"],
  ["Korean", "korean"],
  ["Latin", "latin"],
  ["Latin Extended", "latin-ext"],
  ["Malayalam", "malayalam"],
  ["Myanmar", "myanmar"],
  ["Oriya", "oriya"],
  ["Sinhala", "sinhala"],
  ["Tamil", "tamil"],
  ["Telugu", "telugu"],
  ["Thai", "thai"],
  ["Tibetan", "tibetan"],
  ["Vietnamese", "vietnamese"],
];
const languageAtomArr = atom(dropdownAtomArr(languageData.length));

const LanguagesDropdown = () => {
  return (
    <Dropdown
      checkboxAtom={languageAtomArr}
      data={languageData}
      placeholder="All languages"
      valuePrefix="subsets:"
    />
  );
};

const categoryData: [string, string][] = [
  ["Serif", "serif"],
  ["Sans Serif", "sans-serif"],
  ["Display", "display"],
  ["Handwriting", "handwriting"],
  ["Monospace", "monospace"],
  ["Other", "other"],
];
const categoryAtomArr = atom(dropdownAtomArr(categoryData.length));

const CategoriesDropdown = () => {
  return (
    <Dropdown
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
