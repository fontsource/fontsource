import { Skeleton } from "@chakra-ui/react";
import { promises as fs } from "fs";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import path from "path";

import { FontPageProps, MetadataProps } from "../../@types/[font]";
import { FontPreview } from "../../components/FontPreview";
import { Main } from "../../components/Main";
import { PageContainer } from "../../components/PageContainer";
import fontListAlgolia from "../../configs/algolia.json";
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
  // For sidebar
  const fontListPath = path.join(process.cwd(), "src/configs/fontList.json");
  const sideBarList = fontListAlgolia.map((font) => ({
    key: font.fontId,
    title: font.fontName,
    path: `/fonts/${font.fontId}`,
  }));
  await fs.writeFile(fontListPath, JSON.stringify(sideBarList));

  // Pushes a list of fontIds which will be used as paths e.g. /fonts/abel
  const paths = fontListAlgolia.map((fontMeta) => {
    const font = fontMeta.fontId;
    return { params: { font } };
  });

  return {
    paths,
    // Fallback to generate any new fonts that are introduced.
    fallback: true,
  };
};
