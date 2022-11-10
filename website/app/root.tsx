import { AppShell } from '@components';
import type { ColorScheme } from '@mantine/core';
import {
  ColorSchemeProvider,
  createEmotionCache,
  MantineProvider,
} from '@mantine/core';
import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import { StylesPlaceholder } from '@mantine/remix';
import type {
  HeadersFunction,
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';

import fonts from './styles/fonts.css';
import { GlobalStyles } from './styles/global';
import { theme } from './styles/theme';

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'Fontsource',
  viewport: 'width=device-width,initial-scale=1',
});

export const headers: HeadersFunction = () => ({
  'Accept-CH': 'Sec-CH-Prefers-Color-Scheme',
});

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: fonts }];

createEmotionCache({ key: 'mantine' });

export const loader: LoaderFunction = async ({ request }) => ({
  colorScheme: await request.headers.get('Sec-CH-Prefers-Color-Scheme'),
});
interface DocumentProps {
  children: React.ReactNode;
  title?: string;
  preferredColorScheme?: ColorScheme;
}

export const Document = ({ children, title, preferredColorScheme }: DocumentProps) => {
  // TODO use cookies to set color scheme to get around theme flashing on load
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'color-scheme',
    defaultValue: preferredColorScheme ?? 'light',
    getInitialValueInEffect: true,
  });
  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme =
      value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(nextColorScheme);
  };

  // CTRL + J to toggle color scheme
  useHotkeys([['mod+J', () => toggleColorScheme()]]);

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


export const unstable_shouldReload = () => false;