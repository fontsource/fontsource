import { ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Button,
  Checkbox,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Spacer,
  Stack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { AiOutlineFontSize } from "react-icons/ai";
import { Configure, connectAutoComplete } from "react-instantsearch-dom";

import { MetadataProps } from "../../@types/[font]";
import { NextChakraLink } from "../NextChakraLink";

const FilterPopoverContent = (props) => (
  <PopoverContent width="100%">
    <PopoverArrow />
    <PopoverBody
      overflowY="auto"
      sx={{
        "&::-webkit-scrollbar": {
          width: "16px",
          borderRadius: "8px",
          backgroundColor: `rgba(0, 0, 0, 0.05)`,
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: `rgba(0, 0, 0, 0.1)`,
          borderRadius: "20px",
          border: "4px solid transparent",
          backgroundClip: "content-box",
        },
      }}
    >
      <Stack maxHeight="300px" {...props} />
    </PopoverBody>
  </PopoverContent>
);

const Filter = (props) => {
  const [filterItems, setFilterItems] = useState([]);

  const handleFilterChange = (filterValue: string) => {
    if (filterItems.includes(filterValue)) {
      const filteredArray = filterItems.filter((item) => item !== filterValue);
      setFilterItems(filteredArray);
    } else {
      setFilterItems([...filterItems, filterValue]);
    }
  };

  const languages = {
    arabic: "Arabic",
    bengali: "Bengali",
    "chinese-hongkong": "Chinese (Hong Kong)",
    "chinese-simplified": "Chinese (Simplified)",
    "chinese-traditional": "Chinese (Traditional)",
    cyrillic: "Cyrillic",
    "cyrillic-ext": "Cyrillic Extended",
    devanagari: "Devanagari",
    greek: "Greek",
    "greek-extended": "Greek Extended",
    gujarati: "Gujarati",
    gurmukhi: "Gurmukhi",
    hebrew: "Hebrew",
    japanese: "Japanese",
    kannada: "Kannada",
    khmer: "Khmer",
    korean: "Korean",
    latin: "Latin",
    "latin-ext": "Latin Extended",
    malayalam: "Malayalam",
    myanmar: "Myanmar",
    oriya: "Oriya",
    sinhala: "Sinhala",
    tamil: "Tamil",
    telugu: "Telugu",
    thai: "Thai",
    tibetan: "Tibetan",
    vietnamese: "Vietnamese",
  };

  const categories = {
    serif: "Serif",
    "sans-serif": "Sans Serif",
    display: "Display",
    handwriting: "Handwriting",
    monospace: "Monospace",
    other: "Other",
  };

  return (
    <>
      <Configure hitsPerPage={8} facetFilters={filterItems} />
      <Flex
        display={{ base: "none", md: "flex" }}
        justify="space-between"
        direction="row"
        {...props}
      >
        <Popover autoFocus={true}>
          <PopoverTrigger>
            <Button rightIcon={<ChevronDownIcon />}>Languages</Button>
          </PopoverTrigger>
          <FilterPopoverContent>
            {Object.keys(languages).map((subset) => (
              <Checkbox
                key={subset}
                value={`subsets:${subset}`}
                onChange={(event) => handleFilterChange(event.target.value)}
              >
                {languages[subset]}
              </Checkbox>
            ))}
          </FilterPopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger>
            <Button rightIcon={<ChevronDownIcon />}>Categories</Button>
          </PopoverTrigger>
          <FilterPopoverContent>
            {Object.keys(categories).map((category) => (
              <Checkbox
                key={category}
                value={`category:${category}`}
                onChange={(event) => handleFilterChange(event.target.value)}
              >
                {categories[category]}
              </Checkbox>
            ))}
          </FilterPopoverContent>
        </Popover>
        <Checkbox
          value="variable:true"
          onChange={(event) => handleFilterChange(event.target.value)}
        >
          Show variable fonts
        </Checkbox>
      </Flex>
    </>
  );
};

// Should match Algolia index records
interface Hit extends MetadataProps {
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
        mb={4}
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
      <Filter mb={4} />
      <Stack rounded="lg">
        {hits.map((hit) => {
          const fontPath = hit.fontName.toLowerCase().replaceAll(" ", "-");
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
                <Text>{hit.fontName}</Text>
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

export const CustomSearch = connectAutoComplete(Search);
