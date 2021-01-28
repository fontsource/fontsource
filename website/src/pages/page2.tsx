import { Text } from "@chakra-ui/react";
import Head from "next/head";

import { Hero } from "../components/Hero";
import { CTA } from "../components/Index/CTA";
import { Main } from "../components/Main";
import { PageContainer } from "../components/PageContainer";

const Page2 = () => (
  <PageContainer>
    <Head>
      <title>next-lotus-starter | Page 2</title>
    </Head>
    <Main>
      <Hero />
      <Text pb="4rem">Page 2 example.</Text>
      <CTA />
    </Main>
  </PageContainer>
);

export default Page2;
