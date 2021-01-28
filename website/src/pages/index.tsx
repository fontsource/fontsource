import { Code, Link, List, Text } from "@chakra-ui/react";
import Head from "next/head";

import { Hero } from "../components/Hero";
import { CTA } from "../components/Index/CTA";
import { ListItemCustom } from "../components/Index/ListItemCustom";
import { Main } from "../components/Main";
import { PageContainer } from "../components/PageContainer";

const Index = () => (
  <PageContainer>
    <Head>
      <title>next-lotus-starter | Home</title>
    </Head>

    <Main>
      <Hero />
      <Text>
        Personal starter repository built using <Code>Next.js</Code> +{" "}
        <Code>Chakra UI</Code> + <Code>TypeScript</Code>. Based off
        Vercel&apos;s{" "}
        <Link
          isExternal
          to="https://github.com/vercel/next.js/tree/canary/examples/with-chakra-ui-typescript"
        >
          with-chakra-ui-typescript
        </Link>{" "}
        template.
      </Text>

      <List spacing={3} py={10} mt={0}>
        <ListItemCustom href="https://nextjs.org" title="Next.js" />
        <ListItemCustom href="https://chakra-ui.com/" title="Chakra UI" />
        <ListItemCustom
          href="https://www.typescriptlang.org/"
          title="TypeScript"
        />
        <ListItemCustom
          href="https://github.com/fontsource/fontsource"
          title="Fontsource"
        />
        <ListItemCustom
          href="https://react-icons.github.io/react-icons"
          title="React Icons"
        />
        <ListItemCustom href="https://prettier.io/" title="Prettier" />
        <ListItemCustom href="https://eslint.org/" title="ESLint" />
      </List>
      <CTA />
    </Main>
  </PageContainer>
);

export default Index;
