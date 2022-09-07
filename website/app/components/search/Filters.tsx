import {
  UseRefinementListProps,
  useRefinementList,
} from "react-instantsearch-hooks-web";
import {
  Checkbox,
  createStyles,
  Box,
  SimpleGrid,
  useStyles,
  Group,
} from "@mantine/core";
import { useState } from "react";
import { PreviewSelector, SearchBar } from "./TextInput";
import { SizeSlider } from "./SizeSlider";
import { CategoriesDropdown, LanguagesDropdown } from "./Dropdowns";

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
}));

const Filters = () => {
  const { classes } = useStyles();
  const [searchValue, setSearchValue] = useState("");
  const [exampleValue, setExampleValue] = useState(
    "The quick fox jumps over the lazy dog"
  );
  const [fontSize, setFontSize] = useState(32);

  return (
    <Box className={classes.container}>
      <SimpleGrid
        cols={3}
        spacing={0}
        breakpoints={[{ maxWidth: 980, cols: 2 }]}
      >
        <SearchBar
          value={searchValue}
          onChange={event => setSearchValue(event.currentTarget.value)}
        />
        <PreviewSelector
          value={exampleValue}
          onChange={event => setExampleValue(event.currentTarget.value)}
        />
        <SizeSlider value={fontSize} onChange={setFontSize} />
      </SimpleGrid>
      <div className={classes.wrapper}>
        <Group>
          <CategoriesDropdown />
          <LanguagesDropdown />
        </Group>
        <Checkbox label="I agree to sell my privacy" />
      </div>
    </Box>
  );
};

export { Filters };
