import { Box, createStyles, Group, SimpleGrid, Text } from "@mantine/core";
import { useAtom } from "jotai";
import { useEffect, useRef } from "react";
import {
  useInfiniteHits,
  useInstantSearch,
} from "react-instantsearch-hooks-web";

import { previewValueAtom, sizeAtom } from "./atoms";

interface Hit {
  hit: {
    objectID: string;
    fontName: string;
    fontId: string;
    category: string;
    styles: string[];
    subsets: string[];
    type: string;
    variable: boolean;
    weights: number[];
    defSubset: string;
    lastModified: string;
    version: string;
    source: string;
    license: string;
  };
}

const useStyles = createStyles(theme => ({
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: "24px",
    marginLeft: "auto",
    marginRight: "auto",
    overflowWrap: "anywhere",

    height: "332px",
    width: "316px",
    border: `1px solid ${
      theme.colorScheme === "dark"
        ? theme.colors.border[1]
        : theme.colors.border[0]
    }`,
    borderRadius: "4px",
  },

  textGroup: {
    width: "100%",
  },
}));

interface HitComponentProps extends Hit {
  fontSize: number;
  previewText: string;
}
const HitComponent = ({ hit, fontSize, previewText }: HitComponentProps) => {
  const { classes } = useStyles();

  return (
    <Box className={classes.wrapper}>
      <Text size={fontSize}>{previewText}</Text>
      <Group className={classes.textGroup} position="apart">
        <Text size={18} weight={700} component="span">
          {hit.fontName}
        </Text>
        <Text size={15} weight={700} component="span">
          {hit.variable ? "Variable" : ""}
        </Text>
      </Group>
    </Box>
  );
};

const InfiniteHits = () => {
  const [previewValue] = useAtom(previewValueAtom);
  const [size] = useAtom(sizeAtom);

  // Infinite Scrolling
  const { results, indexUiState } = useInstantSearch();
  const { hits, isLastPage, showMore } = useInfiniteHits();
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (sentinelRef.current !== null) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isLastPage) {
            showMore();
          }
        });
      });

      observer.observe(sentinelRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [isLastPage, showMore]);

  // The `__isArtificial` flag makes sure to not display the No Results message
  // when no hits have been returned yet.
  if (!results.__isArtificial && results.nbHits === 0) {
    return (
      <Box>
        <Text>No results found for "{indexUiState.query}"</Text>
      </Box>
    );
  }

  return (
    <Box>
      <SimpleGrid
        breakpoints={[
          // e.g. 316px * 4 + 16px gap * 3
          { minWidth: 1312, cols: 4, spacing: 16 },
          { minWidth: 980, cols: 3, spacing: 16 },
          { minWidth: 648, cols: 2, spacing: 16 },
          { minWidth: 0, cols: 1, spacing: 16 },
        ]}
      >
        {hits.map(hit => (
          <HitComponent
            key={hit.objectID}
            hit={hit}
            previewText={previewValue}
            fontSize={size}
          />
        ))}
        <div ref={sentinelRef} aria-hidden="true" key="sentinel" />
      </SimpleGrid>
    </Box>
  );
};

export { InfiniteHits };
