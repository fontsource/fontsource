import {
  Checkbox,
  createStyles,
  Box,
  SimpleGrid,
  Group,
  Button,
} from "@mantine/core";
import { SearchBar } from "./SearchTextInput";
import { PreviewSelector } from "./PreviewTextInput";
import { SizeSlider } from "./SizeSlider";
import { CategoriesDropdown, LanguagesDropdown } from "./Dropdowns";
import { IconTrash } from "@components";
import { FilterProps } from "./types";
import { useState } from "react";

const useStyles = createStyles(theme => ({
  container: {
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.background[2]
        : theme.colors.background[0],
    borderRadius: "4px",
    height: 128,
  },

  wrapper: {
    display: "flex",
    height: 64,
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0px 24px",
    backgroundColor:
      theme.colorScheme === "dark"
        ? theme.colors.background[2]
        : theme.colors.background[0],

    "&:focus-within": {
      borderBottomColor: theme.colors.purple[0],
    },
  },

  button: {
    padding: "2px 16px",
    height: "40px",

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

const Filters = ({ size, preview }: FilterProps) => {
  const { classes } = useStyles();

  const [filterItems, setFilterItems] = useState<string[]>([]);

  const handleFilterChange = (filterValue: string) => {
    if (filterItems.includes(filterValue)) {
      const filteredArray = filterItems.filter(item => item !== filterValue);
      setFilterItems(filteredArray);
    } else {
      setFilterItems([...filterItems, filterValue]);
    }
  };

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
        <PreviewSelector
          label={preview.label}
          labelChange={preview.labelChange}
          inputView={preview.inputView}
          onChangeEvent={preview.onChangeEvent}
          onChangeValue={preview.onChangeValue}
        />
        <SizeSlider value={size.value} onChange={size.onChange} />
      </SimpleGrid>
      <div className={classes.wrapper}>
        <Group position="center">
          <CategoriesDropdown />
          <LanguagesDropdown />
        </Group>
        <Group>
          <Checkbox color="purple" label="Show only variable fonts" />
          <Button
            leftIcon={<IconTrash />}
            variant="subtle"
            className={classes.button}
          >
            Clear all filters
          </Button>
        </Group>
      </div>
    </Box>
  );
};

export { Filters };
