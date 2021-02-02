import fs from "fs";
import matter from "gray-matter";
import Head from "next/head";
import hydrate from "next-mdx-remote/hydrate";
import renderToString from "next-mdx-remote/render-to-string";
import path from "path";

import { Main } from "../../components/Main";
import CustomMdxComponents from "../../components/MdxComponents";
import { PageContainer } from "../../components/PageContainer";
import { DOCS_PATH, docsFilePaths } from "../../utils/mdxUtils";

// MDX components since Webpack isn't importing them
const components = {
  ...CustomMdxComponents,
};

export default function DocsPage({ source, frontMatter }) {
  const content = hydrate(source, { components });
  return (
    <PageContainer>
      <Head>
        <title>Fontsource | {frontMatter.title}</title>
      </Head>
      <Main
        borderLeftWidth={{ base: 0, md: "1px" }}
        maxWidth={{ base: "90vw", md: "55vw" }}
        paddingLeft={{ base: "1rem", md: "2em" }}
      >
        {content}
      </Main>
    </PageContainer>
  );
}

export const getStaticProps = async ({ params }) => {
  const postFilePath = path.join(DOCS_PATH, `${params.slug}.mdx`);
  const source = fs.readFileSync(postFilePath);

  const { content, data } = matter(source);

  const mdxSource = await renderToString(content, {
    components,
    // Optionally pass remark/rehype plugins
    mdxOptions: {
      remarkPlugins: [require("remark-slug")],
      rehypePlugins: [],
    },
    scope: data,
  });

  return {
    props: {
      source: mdxSource,
      frontMatter: data,
    },
  };
};

export const getStaticPaths = async () => {
  const paths = docsFilePaths
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, ""))
    // Map the path into the static paths object required by Next.js
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};
