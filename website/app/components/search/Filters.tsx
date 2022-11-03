import { IconTrash } from '@components';
import {
  Box,
  Button,
  Checkbox,
  createStyles,
  Group,
  SimpleGrid,
} from '@mantine/core';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { useConfigure } from 'react-instantsearch-hooks-web';

import { dropdownAtomArr, filterAtom, filterBaseAtom } from './atoms';
import {
  CategoriesDropdown,
  categoryAtomArr,
  languageAtomArr,
  LanguagesDropdown,
} from './Dropdowns';
import { PreviewSelector } from './PreviewTextInput';
import { SearchBar } from './SearchTextInput';
import { SizeSlider } from './SizeSlider';

const useStyles = createStyles(theme => ({
  container: {
    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.background[2]
        : theme.colors.background[0],
    borderRadius: '4px',
    height: 128,
  },

  wrapper: {
    display: 'flex',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0px 24px',
    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.background[2]
        : theme.colors.background[0],

    '&:focus-within': {
      borderBottomColor: theme.colors.purple[0],
    },
  },

  button: {
    padding: '2px 16px',
    height: '40px',

    backgroundColor:
      theme.colorScheme === 'dark'
        ? theme.colors.background[2]
        : theme.colors.background[0],

    color:
      theme.colorScheme === 'dark'
        ? theme.colors.text[0]
        : theme.colors.text[1],

    fontWeight: 400,

    '&:hover': {
      backgroundColor: theme.colors.purpleHover[0],
    },
  },
}));

const Filters = () => {
  const { classes } = useStyles();
  const [variable, setVariable] = useState(false);

  const [, setBaseFilter] = useAtom(filterBaseAtom);
  const [filterItems, setFilterItems] = useAtom(filterAtom);

  const [languageItems, setLanguageItems] = useAtom(languageAtomArr);
  const [categoryItems, setCategoryItems] = useAtom(categoryAtomArr);

  useConfigure({ facetFilters: filterItems });

  return (
    <Box className={classes.container}>
      <SimpleGrid
        cols={3}
        spacing={0}
        breakpoints={[
          { maxWidth: 980, cols: 2 },
          { maxWidth: 680, cols: 1 },
        ]}
      >
        <SearchBar />
        <PreviewSelector />
        <SizeSlider />
      </SimpleGrid>
      <div className={classes.wrapper}>
        <Group position="center">
          <CategoriesDropdown />
          <LanguagesDropdown />
        </Group>
        <Group>
          <Checkbox
            color="purple"
            label="Show only variable fonts"
            value="variable:true"
            checked={variable}
            onChange={event => {
              setVariable(!variable);
              setFilterItems(event.target.value);
            }}
          />
          <Button
            leftIcon={<IconTrash />}
            variant="subtle"
            className={classes.button}
            onClick={() => {
              setVariable(false);
              setLanguageItems(dropdownAtomArr(languageItems.length));
              setCategoryItems(dropdownAtomArr(categoryItems.length));
              setBaseFilter([]);
            }}
          >
            Clear all filters
          </Button>
        </Group>
      </div>
    </Box>
  );
};

export { Filters };
