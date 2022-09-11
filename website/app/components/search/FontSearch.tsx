import algoliasearch from "algoliasearch/lite";
import {
  InstantSearch,
  RefinementList,
  SearchBox,
} from "react-instantsearch-hooks-web";
import { Container, Box } from "@mantine/core";

import { Filters } from "./Filters";

const searchClient = algoliasearch(
  "WNATE69PVR",
  "8b36fe56fca654afaeab5e6f822c14bd"
);

const FontSearch = () => {
  return (
    <InstantSearch searchClient={searchClient} indexName="prod_FONTS">
      <RefinementList attribute="brand" />
      <SearchBox />
    </InstantSearch>
  );
};

const FontSearchDummy = () => {
  return (
    <Box
      sx={theme => ({
        backgroundColor:
          theme.colorScheme === "dark"
            ? theme.colors.background[3]
            : theme.colors.background[1],
      })}
    >
      <Box
        sx={{
          maxWidth: "1440px",
          marginLeft: "auto",
          marginRight: "auto",
          padding: "40px 64px",
        }}
      >
        <Filters />
      </Box>
    </Box>
  );
};

export { FontSearch, FontSearchDummy };
