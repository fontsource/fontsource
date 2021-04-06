import { Box } from "@chakra-ui/layout";
import algoliasearch from "algoliasearch/lite";
import {
  Configure,
  Hits,
  InstantSearch,
  SearchBox,
} from "react-instantsearch-dom";

import { NextChakraLink } from "../NextChakraLink";
import { FontSearchStyles } from "./InstantSearch.styles";

const indexName = "prod_FONTS";
const searchClient = algoliasearch(
  "WNATE69PVR",
  "8b36fe56fca654afaeab5e6f822c14bd"
);

export const FontSearch = () => (
  <>
    <InstantSearch searchClient={searchClient} indexName={indexName}>
      <FontSearchStyles />
      <Configure />
      <SearchBox showLoadingIndicator />
      <Hits hitComponent={HitComponent} />
    </InstantSearch>
  </>
);

const HitComponent = ({ hit }) => {
  const fontPath = hit.family.toLowerCase().replaceAll(" ", "-");
  return (
    <Box>
      <NextChakraLink href={`/fonts/${fontPath}`}>{hit.family}</NextChakraLink>
    </Box>
  );
};
