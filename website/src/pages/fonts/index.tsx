import { Heading } from "@chakra-ui/react";
import Head from "next/head";

import { Container } from "../../components/Container";
import { Main } from "../../components/Main";
import { PageContainer } from "../../components/PageContainer";
import { SearchModal } from "../../components/Search/Modal";

const Index = () => (
  <PageContainer ifDocs={false} ifSidebar={true}>
    <Head>
      <title>Preview | Fontsource</title>
    </Head>
    <Main mx="auto">
      <Heading fontSize={{ base: "10vw", md: "6vw", xl: "75px" }} mt="22vh">
        Fontsource
      </Heading>
      <Container py={2}>
        <SearchModal />
      </Container>
    </Main>
  </PageContainer>
);

export default Index;
