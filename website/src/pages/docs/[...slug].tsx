import fs from "fs";
import matter from "gray-matter";
import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import path from "path";
import remarkGfm from "remark-gfm";

import { Main } from "../../components/Main";
import CustomMdxComponents from "../../components/MdxComponents";
import { PageContainer } from "../../components/PageContainer";
import { DOCS_PATH, docsFilePaths } from "../../utils/mdxUtils";

// MDX components since Webpack isn't importing them
const components = {
  ...CustomMdxComponents,
};

export default function DocsPage({ source, frontMatter }) {
  return (
    <PageContainer ifDocs={true}>
      <Head>
        <title>Fontsource | {frontMatter.title}</title>
      </Head>
      <Main
        borderLeftWidth={{ base: 0, md: "1px" }}
        ml={{ md: 8 }}
        pl={{ base: "1rem", md: "2em" }}
        minHeight="80vh"
        spacing="none"
        maxWidth="49rem"
        width={{ base: "100%", md: "calc(96% - 270px)" }}
      >
        <MDXRemote {...source} components={components} />
      </Main>
    </PageContainer>
  );
}

interface PathProps {
  params: {
    slug: string[];
  };
}

export const getStaticProps: GetStaticProps = async ({ params }: PathProps) => {
  const docFilePath = path.join(DOCS_PATH, `${params.slug.join("/")}.mdx`);
  const source = fs.readFileSync(docFilePath);

  const { content, data } = matter(source);

  const mdxSource = await serialize(content, {
    // Optionally pass remark/rehype plugins
    mdxOptions: {
      remarkPlugins: [remarkGfm],
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

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = docsFilePaths
    // Remove file extensions for page paths
    .map((path) => path.replace(/\.mdx?$/, ""))
    // Split into array for a nested dynamic route. Splice to remove first "/" creating empty array value
    .map((path) => path.split("/").splice(1))
    // Map the path into the static paths object required by Next.js
    .map((slug) => ({ params: { slug } }));

  return {
    paths,
    fallback: false,
  };
};
