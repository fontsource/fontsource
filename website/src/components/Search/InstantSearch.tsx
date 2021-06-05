import { Box, Button, Stack, useColorModeValue } from "@chakra-ui/react";
import algoliasearch from "algoliasearch/lite";
import {
  connectStateResults,
  InstantSearch,
  PoweredBy,
} from "react-instantsearch-dom";

import { CustomPagination } from "./Pagination";
import { CustomSearch } from "./Search";

const indexName = "prod_FONTS";
const searchClient = algoliasearch(
  "WNATE69PVR",
  "8b36fe56fca654afaeab5e6f822c14bd"
);

const LoadingIndicator = connectStateResults(
  ({ isSearchStalled }) =>
    isSearchStalled && (
      <Stack mt={2} direction="column">
        <Button isLoading />
      </Stack>
    )
);

export const FontSearch = () => {
  const bgModal = useColorModeValue("white", "gray.800");

  return (
    <InstantSearch searchClient={searchClient} indexName={indexName}>
      <Box bg={bgModal} rounded="lg" padding={6}>
        <CustomSearch />
        <LoadingIndicator />
        <CustomPagination />
        <Box
          position={{ base: "inherit", md: "absolute" }}
          transform={{ base: "scale(0.7)", md: "scale(0.7) translateY(-155%)" }}
          align="center"
          mt={2}
          ml={{
            md: "65%",
          }}
        >
          <PoweredBy />
        </Box>
      </Box>
    </InstantSearch>
  );
};
