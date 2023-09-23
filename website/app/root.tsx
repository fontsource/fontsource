import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/source-code-pro/wght.css';
import '@mantine/core/styles.css';
import './styles/global.module.css';

import { enableLegendStateReact } from '@legendapp/state/react';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { cssBundleHref } from '@remix-run/css-bundle';
import type {
	HeadersFunction,
	LinksFunction,
	LoaderFunction,
} from '@remix-run/node';
import {
	Links,
	LiveReload,
	Meta,
	type MetaFunction,
	Outlet,
	Scripts,
	ScrollRestoration,
} from '@remix-run/react';

import { AppShell } from '@/components';
import { getThemeSession } from '@/utils/theme.server';

import { ogMeta } from './utils/meta';
import { theme } from './styles/theme';

enableLegendStateReact();

export const meta: MetaFunction = () => {
	return ogMeta({
		title: 'Fontsource',
		description: 'Self-host Open Source fonts in neatly bundled packages.',
	});
};

export const headers: HeadersFunction = () => ({
	'Accept-CH': 'Sec-CH-Prefers-Color-Scheme',
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

export const loader: LoaderFunction = async ({ request }) => {
	const themeSession = await getThemeSession(request);

	const data = {
		colorScheme: themeSession.getTheme(),
		headerColorScheme: request.headers.get('Sec-CH-Prefers-Color-Scheme'),
	};

	return data;
};

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
			<MantineProvider theme={theme}>
				<body
					style={{
						display: 'flex', // If content is smaller than viewport, footer will be at bottom
						minHeight: '100vh',
						flexDirection: 'column',
						justifyContent: 'flex-start',
					}}
				>
					<AppShell>{children}</AppShell>
					<ScrollRestoration />
					<Scripts />
					<LiveReload />
				</body>
			</MantineProvider>
		</html>
	);
};

export default function App() {
	// const { colorScheme, headerColorScheme } = useLoaderData();
	// const preferredColorScheme = colorScheme ?? headerColorScheme;

	return (
		<Document>
			<Outlet />
		</Document>
	);
}

export const shouldRevalidate = () => false;
