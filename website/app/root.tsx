import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/source-code-pro/wght.css';
import 'fallback-font/fallback-outline.css';
import '@mantine/core/styles.css';
import '@/styles/global.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { cssBundleHref } from '@remix-run/css-bundle';
import type {
	HeadersFunction,
	LinksFunction,
	MetaFunction,
} from '@remix-run/node';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';

import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/styles/theme';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	return ogMeta({});
};

export const headers: HeadersFunction = () => ({
	'Cache-Control': 'public, s-maxage=60',
});

export const links: LinksFunction = () => [
	...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
	{
		rel: 'preconnect',
		href: 'https://cdn.jsdelivr.net/',
	},
	{
		rel: 'apple-touch-icon',
		sizes: '180x180',
		href: '/apple-touch-icon.png',
	},
	{
		rel: 'icon',
		type: 'image/png',
		sizes: '32x32',
		href: '/favicon-32x32.png',
	},
	{
		rel: 'icon',
		type: 'image/png',
		sizes: '16x16',
		href: '/favicon-16x16.png',
	},
	{
		rel: 'manifest',
		href: '/site.webmanifest',
	},
];

interface DocumentProps {
	children: React.ReactNode;
}

export const Document = ({ children }: DocumentProps) => {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<Meta />
				<Links />
				<ColorSchemeScript />
			</head>
			<body>
				<MantineProvider theme={theme}>
					<AppShell>{children}</AppShell>
					<ScrollRestoration />
					<Scripts />
					<LiveReload />
				</MantineProvider>
			</body>
		</html>
	);
};

export default function App() {
	return (
		<Document>
			<Outlet />
		</Document>
	);
}
