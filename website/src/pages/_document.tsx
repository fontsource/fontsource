import { ColorModeScript } from "@chakra-ui/react";
import NextDocument, { Head, Html, Main, NextScript } from "next/document";

import theme from "../theme";

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en" dir="ltr">
        <Head>
          <meta name="application-name" content="Fontsource" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta
            name="apple-mobile-web-app-status-bar-style"
            content="default"
          />
          <meta name="apple-mobile-web-app-title" content="Fontsource" />
          <meta
            name="description"
            content="Self-host fonts in neatly bundled NPM packages."
          />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/icons/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/icons/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/icons/favicon-16x16.png"
          />
          <link rel="manifest" href="/manifest.webmanifest" />
          <link
            rel="mask-icon"
            href="/icons/safari-pinned-tab.svg"
            color="#000000"
          />
          <link rel="shortcut icon" href="/icons/favicon.ico" />
          <meta name="msapplication-TileColor" content="#da532c" />
          <meta name="msapplication-config" content="/browserconfig.xml" />
          <meta name="theme-color" content="#ffffff" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:url" content="https://fontsource.org" />
          <meta name="twitter:title" content="Fontsource" />
          <meta
            name="twitter:description"
            content="Self-host fonts in neatly bundled NPM packages."
          />
          <meta
            name="twitter:image"
            content="https://fontsource.org/icons/android-chrome-192x192.png"
          />
          <meta name="twitter:creator" content="@lotusdevshack" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="Fontsource" />
          <meta
            property="og:description"
            content="Self-host fonts in neatly bundled NPM packages."
          />
          <meta property="og:site_name" content="Fontsource" />
          <meta property="og:url" content="https://fontsource.org" />
          <meta
            property="og:image"
            content="https://fontsource.org/icons/apple-touch-icon.png"
          />
        </Head>
        <body>
          {/* Make Color mode to persists when you refresh the page. */}
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
