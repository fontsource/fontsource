import { Skeleton } from "@chakra-ui/react";
import { Octokit } from "@octokit/rest";
import { capitalCase } from "capital-case";
import { promises as fs } from "fs";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import path from "path";

import { FontPageProps, MetadataProps } from "../../@types/[font]";
import { FontPreview } from "../../components/FontPreview";
import { Main } from "../../components/Main";
import { PageContainer } from "../../components/PageContainer";
import fontListTemp from "../../configs/fontListTemp.json";
import { selectDefPreviewText } from "../../utils/defPreviewLanguage";
import { fetcher, fontsourceDownload } from "../../utils/fontsourceUtils";

export default function FontPage({ metadata, defPreviewText }: FontPageProps) {
  const { isFallback } = useRouter();

  if (isFallback) {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex" />
          <title>Loading... | Fontsource</title>
        </Head>
        <PageContainer ifDocs={false}>
          <Main
            width="100%"
            mr={{ md: 0 }}
            pr={{ md: 0 }}
            mb={12}
            ml={{ md: 8 }}
          >
            <Skeleton height="50px" />
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
        <Main width="100%" mr={{ md: 0 }} pr={{ md: 0 }} mb={12} ml={{ md: 8 }}>
          <FontPreview defPreviewText={defPreviewText} metadata={metadata} />
        </Main>
      </PageContainer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const metadata: MetadataProps = await fetcher(
      fontsourceDownload.data(`${params.font}`).metadata
    );

    // Generates preview texts in matching languages
    const defPreviewText = selectDefPreviewText(
      metadata.fontId,
      metadata.defSubset
    );

    return metadata
      ? { props: { metadata, defPreviewText }, revalidate: 7200 }
      : { notFound: true };
  } catch (error) {
    // If metadata doesn't exist
    console.error(error);
    return { notFound: true };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Gets FONTLIST.json, find all keys and determine paths
  /*const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
    userAgent: "Fontsource Website",
  });*/

  // Temporarily commented out to prevent 1000s of pages created in testing
  // Cannot update @octokit/rest past 18.0.9 until this issue is resolved - https://github.com/octokit/rest.js/issues/1971
  /* let content;
  await octokit.repos
    .getContent({
      owner: "fontsource",
      repo: "fontsource",
      path: "/FONTLIST.json",
    })
    .then(({ data }) => {
      // content will be base64 encoded
      content = JSON.parse(Buffer.from(data.content, "base64").toString());
    });*/

  // const fontList = Object.keys(content);
  const fontList = Object.keys(fontListTemp);

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
