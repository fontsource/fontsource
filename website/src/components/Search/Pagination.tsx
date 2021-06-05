import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import { Button, IconButton, Stack } from "@chakra-ui/react";
import { connectPagination } from "react-instantsearch-dom";

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

export const CustomPagination = connectPagination(Pagination);
