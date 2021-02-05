import { Skeleton, Text } from "@chakra-ui/react";
import { GetStaticPaths, GetStaticProps } from "next";
import DefaultErrorPage from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";
import useSWR from "swr";

import { PageContainer } from "../../components/PageContainer";
import { fetcher, fontsourceData } from "../../utils/fontsourceUtils";

export default function FontPage({ font }) {
  const { isFallback } = useRouter();
  const { data, error } = useSWR(fontsourceData.list, fetcher, {
    initialData: font,
  });

  if (error) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex" />
        </Head>
        <DefaultErrorPage statusCode={404} />
      </>
    );
  }

  if (!data) return <Skeleton height="20px" />;

  return (
    <PageContainer>
      {isFallback ? <Skeleton height="20px" /> : <Text>Loaded</Text>}
    </PageContainer>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // `getStaticProps` is invoked on the server-side,
  // so this `fetcher` function will be executed on the server-side.
  try {
    const metadata = await fetcher(
      fontsourceData.data(`${params.font}`).metadata
    );
    return metadata ? { props: { metadata } } : { notFound: true };
  } catch (error) {
    // If GitHub of all places died
    console.error(error);
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Gets FONTLIST.json, find all keys and determine paths
  const paths = await fetcher(fontsourceData.list).then((res) =>
    res.map((fonts) => Object.keys(fonts)).map((font) => ({ params: { font } }))
  );

  return {
    paths,
    fallback: true,
  };
};
