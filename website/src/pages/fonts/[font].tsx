import { Skeleton, Text } from "@chakra-ui/react";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";

import { FontPageProps, MetadataProps } from "../../@types/[font]";
import { PageContainer } from "../../components/PageContainer";
import FontDownload from "../../hooks/FontDownload";
import { fetcher, fontsourceData } from "../../utils/fontsourceUtils";

export default function FontPage({ metadata, downloadLink }: FontPageProps) {
  const { isFallback } = useRouter();

  let fontLoaded: boolean;
  if (metadata) {
    fontLoaded = FontDownload(metadata, downloadLink);
  }

  if (isFallback || !fontLoaded) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex" />
          <title>Loading...</title>
        </Head>
        <PageContainer>
          <Skeleton height="50px" />
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
        <Text style={{ fontFamily: metadata.fontName }}>
          The quick brown fox jumps over the lazy dog.
        </Text>
      </PageContainer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // `getStaticProps` is invoked on the server-side,
  // so this `fetcher` function will be executed on the server-side.
  try {
    const metadata: MetadataProps = await fetcher(
      fontsourceData.data(`${params.font}`).metadata
    );

    const downloadLink = await fontsourceData.fontDownload(
      metadata.fontId,
      metadata.defSubset,
      metadata.weights
    );

    return metadata
      ? { props: { metadata, downloadLink }, revalidate: 7200 }
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
