import { Skeleton, Text } from "@chakra-ui/react";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

import { PageContainer } from "../../components/PageContainer";
import { fetcher, fontsourceData } from "../../utils/fontsourceUtils";

export default function FontPage({ metadata }) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex" />
          <title>Loading...</title>
        </Head>
        <PageContainer>
          <Skeleton height="20px" />
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{metadata.fontName} | Fontsource</title>
      </Head>
      <PageContainer>
        <Text>Loaded</Text>
      </PageContainer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // `getStaticProps` is invoked on the server-side,
  // so this `fetcher` function will be executed on the server-side.
  try {
    const metadata = await fetcher(
      fontsourceData.data(`${params.font}`).metadata
    );
    return metadata
      ? { props: { metadata }, revalidate: 7200 }
      : { notFound: true };
  } catch (error) {
    // If metadata doesn't exist
    console.error(error);
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Gets FONTLIST.json, find all keys and determine paths
  const paths = await fetcher(fontsourceData.list).then((res) =>
    Object.keys(res).map((font) => ({ params: { font } }))
  );

  return {
    paths,
    fallback: true,
  };
};
