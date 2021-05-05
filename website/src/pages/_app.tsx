import "@fontsource/inter/variable.css";
import "@fontsource/raleway/variable.css";

import { ChakraProvider } from "@chakra-ui/react";
import { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";

import theme from "../theme";

function MyApp({ Component, pageProps }: AppProps) {
  // Next.js bug where page state is not reset - https://github.com/vercel/next.js/issues/9992
  // Refer to components/FontPreview.tsx where the defPreviewText state isn't reset on route change
  const { asPath } = useRouter();
  return (
    <ChakraProvider resetCSS theme={theme}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Component {...pageProps} key={asPath} />
    </ChakraProvider>
  );
}

export default MyApp;
