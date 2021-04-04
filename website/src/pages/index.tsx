import { Button, Heading, Text } from "@chakra-ui/react";
import Head from "next/head";

import { Container } from "../components/Container";
import { Main } from "../components/Main";
import { NextChakraLink } from "../components/NextChakraLink";
import { PageContainer } from "../components/PageContainer";

const Index = () => (
  <PageContainer ifDocs={false} ifSidebar={false}>
    <Head>
      <title>Fontsource</title>
    </Head>
    <Main mx="auto" textAlign="center">
      <Heading fontSize={{ base: "6vw", xl: "75px" }} mt="22vh">
        Fontsource
      </Heading>
      <Text>Self-host Open Source fonts in neatly bundled NPM packages.</Text>
      <Container flexDirection="row" maxWidth="60rem" py={2}>
        <NextChakraLink
          href="/docs/introduction"
          flexGrow={2}
          mx={2}
          prefetch={false}
        >
          <Button size="lg" width="100%" variant="outline" colorScheme="gray">
            Documentation
          </Button>
        </NextChakraLink>
        <NextChakraLink href="/fonts" flexGrow={2} mx={2} prefetch={false}>
          <Button size="lg" width="100%" variant="outline" colorScheme="gray">
            Font Previews
          </Button>
        </NextChakraLink>
      </Container>
    </Main>
  </PageContainer>
);

export default Index;
