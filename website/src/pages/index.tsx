import { Button, Code, Heading, Link, List, Text } from "@chakra-ui/react";
import Head from "next/head";

import { Container } from "../components/Container";
import { Main } from "../components/Main";
import { NextChakraLink } from "../components/NextChakraLink";
import { PageContainer } from "../components/PageContainer";

const Index = () => (
  <PageContainer ifSidebar={false}>
    <Head>
      <title>Fontsource</title>
    </Head>
    <Main>
      <Heading fontSize="6vw">Fontsource</Heading>
      <Container flexDirection="row" maxWidth="48rem" py={2}>
        <NextChakraLink href="/docs/getting-started" flexGrow={1} mx={2}>
          <Button width="100%" variant="outline" colorScheme="green">
            Documentation
          </Button>
        </NextChakraLink>

        <NextChakraLink href="/fonts" flexGrow={3} mx={2}>
          <Button width="100%" variant="solid" colorScheme="green">
            Font Previews
          </Button>
        </NextChakraLink>
      </Container>
    </Main>
  </PageContainer>
);

export default Index;
