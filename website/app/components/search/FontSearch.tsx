import { Container, Box } from "@mantine/core";

import { Filters } from "./Filters";
import { InfiniteHits } from "./Hits";

const FontSearch = () => {
  return (
    <>
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
    </>
  );
};

export { FontSearch };
