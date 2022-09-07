import type {
  MetaFunction,
  HeadersFunction,
  LoaderFunction,
} from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
} from "@remix-run/react";
import { useState } from "react";
import {
  MantineProvider,
  Container,
  ColorSchemeProvider,
  ColorScheme,
} from "@mantine/core";
import { StylesPlaceholder } from "@mantine/remix";
import { useHotkeys } from "@mantine/hooks";
import { theme } from "./styles/theme";
import { getColorScheme } from "./cookies";
import { AppShell } from "@components";
import { GlobalStyles } from "./styles/global";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Fontsource",
  viewport: "width=device-width,initial-scale=1",
});

export const headers: HeadersFunction = () => ({
  "Accept-CH": "Sec-CH-Prefers-Color-Scheme",
});

interface DocumentProps {
  children: React.ReactNode;
  title?: string;
  preferredColorScheme?: ColorScheme;
}

export const loader: LoaderFunction = async ({ request }) => ({
  colorScheme: await getColorScheme(request),
});

const Document = ({ children, title, preferredColorScheme }: DocumentProps) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(
    preferredColorScheme ?? "light"
  );
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));

  // CTRL + J to toggle color scheme
  useHotkeys([["mod+J", () => toggleColorScheme()]]);

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        theme={{ colorScheme, ...theme }}
        withGlobalStyles
        withNormalizeCSS
      >
        <html lang="en">
          <head>
            <Meta />
            <Links />
            <StylesPlaceholder />
          </head>
          <body>
            <GlobalStyles />
            <AppShell>{children}</AppShell>
            <ScrollRestoration />
            <Scripts />
            <LiveReload />
          </body>
        </html>
      </MantineProvider>
    </ColorSchemeProvider>
  );
};

export default function App() {
  const { colorScheme } = useLoaderData();

  return (
    <Document preferredColorScheme={colorScheme}>
      <Outlet />
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Container>
        <p>
          [CatchBoundary]: {caught.status} {caught.statusText}
        </p>
      </Container>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Document title="Error!">
      <Container>
        <p>[ErrorBoundary]: There was an error: {error.message}</p>
      </Container>
    </Document>
  );
}
