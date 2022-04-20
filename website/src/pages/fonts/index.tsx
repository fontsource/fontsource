import { Heading } from "@chakra-ui/react";
import Head from "next/head";
import { CarbonAd } from "website/src/components/CarbonAd";

import { Container } from "../../components/Container";
import { Main } from "../../components/Main";
import { SearchModal } from "../../components/Search/Modal";

const Index = () => (
  <>
    <Head>
      <title>Preview | Fontsource</title>
    </Head>
    <Main mx="auto">
      <Heading
        fontSize={{ base: "10vw", md: "6vw", xl: "75px" }}
        mt="22vh"
        mx="auto"
      >
        Fontsource
      </Heading>
      <Container py={2}>
        <SearchModal />
      </Container>
      <CarbonAd />
    </Main>
  </>
);

export default Index;
