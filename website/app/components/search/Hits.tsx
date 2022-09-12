import { useEffect, useRef } from "react";
import {
  useInfiniteHits,
  UseInfiniteHitsProps,
  useInstantSearch,
} from "react-instantsearch-hooks-web";
import { Container, Group, SimpleGrid, Text } from "@mantine/core";

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

const HitComponent = ({ hit, ...others }: Hit) => {
  return (
    <Container
      sx={{ height: 332, justifyContent: "space-between" }}
      {...others}
    >
      <Text>The quick brown fox jumps off a cliff.</Text>
      <Group sx={{ justifyContent: "space-between" }}>
        <Text weight={700}>{hit.fontName}</Text>
        <Text weight={700}>{hit.variable ? "Variable" : ""}</Text>
      </Group>
    </Container>
  );
};

const InfiniteHits = ({ ...others }: UseInfiniteHitsProps) => {
  const { results, indexUiState } = useInstantSearch();

  const { hits, isLastPage, showMore } = useInfiniteHits(others);
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
      <Container>
        <Text>No results found for "{indexUiState.query}"</Text>
      </Container>
    );
  }

  return (
    <Container>
      <SimpleGrid cols={3}>
        {hits.map(hit => (
          <HitComponent key={hit.objectID} hit={hit} />
        ))}
        <div ref={sentinelRef} aria-hidden="true" key="sentinel" />
      </SimpleGrid>
    </Container>
  );
};

export { InfiniteHits };
