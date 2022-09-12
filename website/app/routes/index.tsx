import { Box, Text, Container } from "@mantine/core";
import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import algoliasearch from "algoliasearch/lite";
import { InstantSearch } from "react-instantsearch-hooks-web";

import { FontSearch } from "~/components/search/FontSearch";
import { unicodeRangeUrl } from "~/utils/fontFace";
import { InfiniteHits } from "~/components/search/Hits";
import { Filters } from "~/components/search/Filters";

const searchClient = algoliasearch(
  "WNATE69PVR",
  "8b36fe56fca654afaeab5e6f822c14bd"
);

export default function Index() {
  return (
    <InstantSearch searchClient={searchClient} indexName="prod_FONTS">
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
      <InfiniteHits />
    </InstantSearch>
  );
}
