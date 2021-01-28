import { Button, Link as ChakraLink } from "@chakra-ui/react";

import { Container } from "../Container";

export const CTA = () => (
  <Container flexDirection="row" width="100%" maxWidth="48rem" py={2}>
    <ChakraLink isExternal href="https://nextjs.org/" flexGrow={1} mx={2}>
      <Button width="100%" variant="outline" colorScheme="green">
        Next.js
      </Button>
    </ChakraLink>

    <ChakraLink
      isExternal
      href="https://github.com/DecliningLotus/next-lotus-starter"
      flexGrow={2}
      mx={2}
    >
      <Button width="100%" variant="solid" colorScheme="green">
        View Repo
      </Button>
    </ChakraLink>
  </Container>
);
