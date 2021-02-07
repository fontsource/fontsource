import { Button, Heading } from "@chakra-ui/react";
import Head from "next/head";

import { Container } from "../../components/Container";
import { Main } from "../../components/Main";
import { NextChakraLink } from "../../components/NextChakraLink";
import { PageContainer } from "../../components/PageContainer";

const Index = () => (
  <PageContainer ifSidebar={true}>
    <Head>
      <title>Fonts | Fontsource</title>
    </Head>
    <Main>
      <Heading fontSize={{ base: "6vw", xl: "75px" }}>Fontsource</Heading>
      <Container flexDirection="row" maxWidth="60rem" py={2}>
        <NextChakraLink href="/fonts/roboto" flexGrow={2} mx={2}>
          <Button size="lg" width="100%" variant="outline" colorScheme="gray">
            Roboto
          </Button>
        </NextChakraLink>
        <NextChakraLink href="/fonts/abeezee" flexGrow={2} mx={2}>
          <Button size="lg" width="100%" variant="outline" colorScheme="gray">
            Test
          </Button>
        </NextChakraLink>
      </Container>
    </Main>
  </PageContainer>
);

export default Index;
