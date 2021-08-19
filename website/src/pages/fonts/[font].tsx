import "fallback-font/fallback-outline.css";

import { Skeleton } from "@chakra-ui/react";
import { promises as fs } from "fs";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import path from "path";

import {
  FontPageProps,
  FontPreviewCss,
  MetadataProps,
} from "../../@types/[font]";
import { FontPreview } from "../../components/FontPreview";
import { Main } from "../../components/Main";
import { PageContainer } from "../../components/PageContainer";
import fontListAlgolia from "../../configs/algolia.json";
// Import when testing and don't want to build 1000+ pages
// import fontListAlgolia from "../../configs/fontListTemp.json";
import { selectDefPreviewText } from "../../utils/defPreviewLanguage";
import {
  fetchJson,
  fetchText,
  fontsourceDownload,
} from "../../utils/fontsourceUtils";
import minifyCss from "../../utils/minifyCss";

export default function FontPage({
  metadata,
  defPreviewText,
  fontCss,
}: FontPageProps) {
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
          <FontPreview
            defPreviewText={defPreviewText}
            metadata={metadata}
            fontCss={fontCss}
          />
        </Main>
      </PageContainer>
    </>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const metadata: MetadataProps = await fetchJson(
      fontsourceDownload.data(`${params.font}`).metadata
    );

    if (!metadata) return { notFound: true };

    // Generates preview texts in matching languages
    const defPreviewText = selectDefPreviewText(
      metadata.fontId,
      metadata.defSubset
    );

    const fontCssNames: [number, string[]][] = [];
    // Fetch css data
    const fontCssData: string[][] = await Promise.all(
      metadata.weights.map((weight) => {
        fontCssNames.push([weight, []]);
        return Promise.all(
          metadata.styles.map((style) => {
            fontCssNames[fontCssNames.length - 1][1].push(style);

            return fetchText(
              fontsourceDownload.cssDownload(metadata.fontId, weight, style)
            );
          })
        );
      })
    );

    const fontCss: FontPreviewCss = {};

    // Correctly map css data to its corispoding type (weight/style), while minimizing the css.
    fontCssNames.forEach((weight, weightIndex) => {
      fontCss[weight[0]] = {};

      weight[1].forEach((style, styleIndex) => {
        fontCss[weight[0]][style] = minifyCss(
          fontCssData[weightIndex][styleIndex]
        ).replace(
          /url\('\.\/(files\/.*?)'\)/g,
          // match "url('./files/${woffFileName}')", then replace with "url('${baseURL}/files/${woffFileName}')"
          `url('${fontsourceDownload.fontDownload(metadata.fontId)}/$1')`
        );
      });
    });

    return { props: { metadata, defPreviewText, fontCss }, revalidate: 7200 };
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
  // Used in Sidebar component
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
