import {
  Checkbox,
  createStyles,
  Box,
  SimpleGrid,
  Group,
  Button,
} from "@mantine/core";
import { useState } from "react";
import { SearchBar } from "./SearchTextInput";
import { PreviewSelector } from "./PreviewTextInput";
import { SizeSlider } from "./SizeSlider";
import { CategoriesDropdown, LanguagesDropdown } from "./Dropdowns";
import { IconTrash } from "@components";

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
  },
}));

const Filters = () => {
  const { classes } = useStyles();
  const [exampleValue, setExampleValue] = useState("");
  const [fontSize, setFontSize] = useState(32);

  return (
    <Box className={classes.container}>
      <SimpleGrid
        cols={3}
        spacing={0}
        breakpoints={[{ maxWidth: 980, cols: 2 }]}
      >
        <SearchBar />
        <PreviewSelector
          value={exampleValue}
          onChange={event => setExampleValue(event.currentTarget.value)}
        />
        <SizeSlider value={fontSize} onChange={setFontSize} />
      </SimpleGrid>
      <div className={classes.wrapper}>
        <Group position="center">
          <CategoriesDropdown />
          <LanguagesDropdown />
        </Group>
        <Group>
          <Checkbox color="purple" label="I agree to sell my privacy" />
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
