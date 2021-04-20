import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "@chakra-ui/icons";
import {
  Box,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Spacer,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import algoliasearch from "algoliasearch/lite";
import { AiOutlineFontSize } from "react-icons/ai";
import {
  Configure,
  connectAutoComplete,
  connectPagination,
  connectStateResults,
  InstantSearch,
} from "react-instantsearch-dom";

import { NextChakraLink } from "../NextChakraLink";

const indexName = "prod_FONTS";
const searchClient = algoliasearch(
  "WNATE69PVR",
  "8b36fe56fca654afaeab5e6f822c14bd"
);
const hitsPerPage = 8;

// Should match Algolia index records
interface Hit {
  family: string;
  category: "serif" | "sans-serif" | "handwriting" | "display" | "monospace";
  variants: string[];
  subsets: string[];
  version: string;
  lastModified: string;
  objectID: string;
}

interface Search {
  hits: Hit[];
  currentRefinement: string;
  refine: (event: string) => void;
}

const Search = ({ hits, currentRefinement, refine }: Search) => {
  const bgSearch = useColorModeValue("gray.50", "gray.900");
  const fontCategory = useColorModeValue("gray.500", "gray.100");
  return (
    <>
      <InputGroup
        color="gray.400"
        variant="outline"
        bg={bgSearch}
        rounded="lg"
        size="lg"
        mb={8}
      >
        <InputLeftElement pointerEvents="none">
          <SearchIcon />
        </InputLeftElement>
        <Input
          type="search"
          placeholder="Search"
          value={currentRefinement}
          onChange={(event) => refine(event.currentTarget.value)}
          aria-label="Search fonts"
        />
      </InputGroup>
      <Stack rounded="lg">
        {hits.map((hit) => {
          const fontPath = hit.family.toLowerCase().replaceAll(" ", "-");
          return (
            <NextChakraLink
              prefetch={false}
              key={hit.objectID}
              href={`/fonts/${fontPath}`}
              passHref
              _hover={{ textDecoration: "none" }}
            >
              <Button
                width="100%"
                leftIcon={<AiOutlineFontSize />}
                justifyContent="left"
              >
                <Text>{hit.family}</Text>
                <Spacer />
                <Text fontSize="sm" color={fontCategory}>
                  {hit.category}
                </Text>
              </Button>
            </NextChakraLink>
          );
        })}
      </Stack>
    </>
  );
};
const CustomSearch = connectAutoComplete(Search);

const LoadingIndicator = connectStateResults(
  ({ isSearchStalled }) =>
    isSearchStalled && (
      <Stack mt={2} direction="column">
        <Button isLoading />
      </Stack>
    )
);

interface PaginationButtonProps {
  page: number;
  refine: (event: number) => void;
  createURL: (page: number) => string;
}

const PaginationButton: React.FC<PaginationButtonProps> = ({
  page,
  createURL,
  refine,
}) => (
  <Button
    href={createURL(page)}
    rounded="md"
    onClick={(event) => {
      event.preventDefault();
      refine(page);
    }}
    display={page <= -1 ? "none" : "inline-flex"}
  >
    {page}
  </Button>
);

interface PaginationProps {
  // Current page
  currentRefinement: number;
  // Number of pages
  nbPages: number;
  refine: (event: number) => void;
  createURL: (page: number) => string;
}

const Pagination = ({
  currentRefinement,
  nbPages,
  refine,
  createURL,
}: PaginationProps) => {
  let firstPageNum = currentRefinement - 1;
  // If reach the last page
  if (currentRefinement === nbPages) {
    firstPageNum = nbPages - 2;
  }
  // If at first page or only page
  if (currentRefinement === 1 || nbPages === 1) {
    firstPageNum = 1;
  }

  // Slice function takes the min value either 3 or nbPages
  const size = new Array(nbPages).fill(null).slice(0, 3);

  return (
    <Stack direction="row" justifyContent="center" mt={8}>
      <IconButton
        aria-label="Go previous"
        icon={<ChevronLeftIcon />}
        isDisabled={currentRefinement === 1}
        onClick={(event) => {
          event.preventDefault();
          refine(currentRefinement - 1);
        }}
      />
      {nbPages !== 0 ? (
        size.map((_, index) => {
          const pageNum = firstPageNum + index;
          return (
            <PaginationButton
              key={pageNum}
              page={pageNum}
              createURL={createURL}
              refine={refine}
            />
          );
        })
      ) : (
        <Button isDisabled>No Results</Button>
      )}

      <IconButton
        aria-label="Go next"
        icon={<ChevronRightIcon />}
        isDisabled={currentRefinement === nbPages || nbPages === 0}
        onClick={(event) => {
          event.preventDefault();
          refine(currentRefinement + 1);
        }}
      />
    </Stack>
  );
};

const CustomPagination = connectPagination(Pagination);

export const FontSearch = () => {
  const bgModal = useColorModeValue("white", "gray.800");

  return (
    <InstantSearch searchClient={searchClient} indexName={indexName}>
      <Configure hitsPerPage={hitsPerPage} />
      <Box bg={bgModal} rounded="lg" padding={6}>
        <CustomSearch />
        <LoadingIndicator />
        <CustomPagination />
      </Box>
    </InstantSearch>
  );
};
