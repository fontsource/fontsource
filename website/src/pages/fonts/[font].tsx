import { Skeleton, Text } from "@chakra-ui/react";
import { Octokit } from "@octokit/rest";
import { capitalCase } from "capital-case";
import { promises as fs } from "fs";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import path from "path";

import { FontPageProps, MetadataProps } from "../../@types/[font]";
import { Main } from "../../components/Main";
import { PageContainer } from "../../components/PageContainer";
import FontDownload from "../../hooks/FontDownload";
import { fetcher, fontsourceDownload } from "../../utils/fontsourceUtils";

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
        <PageContainer ifDocs={false}>
          <Main>
            <Skeleton height="50px" width="100%" />
            <Text>Loading...</Text>
          </Main>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{metadata.fontName} | Fontsource</title>
      </Head>
      <PageContainer ifDocs={false}>
        <Main maxWidth={{ base: "90vw", md: "55vw" }}>
          <Text style={{ fontFamily: metadata.fontName }}>
            Sphinx of black quartz, judge my vow.
          </Text>
        </Main>
      </PageContainer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  // `getStaticProps` is invoked on the server-side,
  // so this `fetcher` function will be executed on the server-side.
  try {
    const metadata: MetadataProps = await fetcher(
      fontsourceDownload.data(`${params.font}`).metadata
    );

    const downloadLink = fontsourceDownload.fontDownload(
      metadata.fontId,
      metadata.defSubset,
      metadata.weights
    );

    const fontList = params.font;

    return metadata
      ? { props: { metadata, downloadLink, fontList }, revalidate: 7200 }
      : { notFound: true };
  } catch (error) {
    // If metadata doesn't exist
    console.error(error);
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Gets FONTLIST.json, find all keys and determine paths
  const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
    userAgent: "Fontsource Website",
  });

  // Cannot update @octokit/rest past 18.0.9 until this issue is resolved - https://github.com/octokit/rest.js/issues/1971
  let content;
  await octokit.repos
    .getContent({
      owner: "fontsource",
      repo: "fontsource",
      path: "/FONTLIST.json",
    })
    .then(({ data }) => {
      // content will be base64 encoded
      content = JSON.parse(Buffer.from(data.content, "base64").toString());
    });

  const fontList = Object.keys(content);

  // For sidebar
  const fontListPath = path.join(process.cwd(), "src/configs/fontList.json");
  const sideBarList = fontList.map((font) => ({
    key: font,
    title: capitalCase(font.replace("-", " ")),
    path: `/fonts/${font}`,
  }));
  await fs.writeFile(fontListPath, JSON.stringify(sideBarList));

  const paths = fontList.map((font) => ({ params: { font } }));

  return {
    paths,
    // Fallback to generate any new fonts that are introduced.
    fallback: true,
  };
};
