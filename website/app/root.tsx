import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/source-code-pro/wght.css';

import { enableLegendStateReact } from '@legendapp/state/react';
import type { ColorScheme } from '@mantine/core';
import {
	ColorSchemeProvider,
	createEmotionCache,
	MantineProvider,
} from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { StylesPlaceholder } from '@mantine/remix';
import { cssBundleHref } from '@remix-run/css-bundle';
import type {
	HeadersFunction,
	LinksFunction,
	LoaderFunction,
} from '@remix-run/node';
import type { V2_MetaFunction } from '@remix-run/react';
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useFetcher,
	useLoaderData,
} from '@remix-run/react';
import { useState } from 'react';

import { AppShell } from '@/components';
import { getThemeSession } from '@/utils/theme.server';

import { GlobalStyles } from './styles/global';
import { theme } from './styles/theme';
import { ogMeta } from './utils/meta';

enableLegendStateReact();

export const meta: V2_MetaFunction = () => {
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

createEmotionCache({ key: 'mantine' });

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
	preferredColorScheme: ColorScheme;
}

export const Document = ({ children, preferredColorScheme }: DocumentProps) => {
	const [colorScheme, setColorScheme] =
		useState<ColorScheme>(preferredColorScheme);
	const updateThemeCookie = useFetcher().submit;
	const toggleColorScheme = (value?: ColorScheme) => {
		const scheme = value ?? (colorScheme === 'dark' ? 'light' : 'dark');
		setColorScheme(scheme);
		updateThemeCookie(
			{ theme: scheme },
			{ method: 'post', action: '/actions/theme' }
		);
	};

	// CTRL + J to toggle color scheme
	useHotkeys([
		[
			'mod+J',
			() => {
				toggleColorScheme();
			},
		],
	]);

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
						<meta charSet="utf-8" />
						<meta
							name="viewport"
							content="width=device-width,initial-scale=1"
						/>
						<Meta />
						<Links />
						<StylesPlaceholder />
					</head>
					<body
						style={{
							display: 'flex', // If content is smaller than viewport, footer will be at bottom
							minHeight: '100vh',
							flexDirection: 'column',
							justifyContent: 'flex-start',
						}}
					>
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
	const { colorScheme, headerColorScheme } = useLoaderData();
	const preferredColorScheme = colorScheme ?? headerColorScheme;

	return (
		<Document preferredColorScheme={preferredColorScheme}>
			<Outlet />
		</Document>
	);
}

export const shouldRevalidate = () => false;
