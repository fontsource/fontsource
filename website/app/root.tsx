import '@fontsource/inter/variable.css';
import '@fontsource/source-code-pro/variable.css';

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
	MetaFunction,
} from '@remix-run/node';
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

export const meta: MetaFunction = () => ({
	charset: 'utf-8',
	title: 'Fontsource',
	viewport: 'width=device-width,initial-scale=1',
});

export const headers: HeadersFunction = () => ({
	'Accept-CH': 'Sec-CH-Prefers-Color-Scheme',
});

export const links: LinksFunction = () => [
	...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
	{
		rel: 'preconnect',
		href: 'https://cdn.jsdelivr.net/',
	},
];

createEmotionCache({ key: 'mantine' });

export const loader: LoaderFunction = async ({ request }) => {
	const themeSession = await getThemeSession(request);

	const data = {
		colorScheme: themeSession.getTheme(),
		headerColorScheme: await request.headers.get('Sec-CH-Prefers-Color-Scheme'),
	};

	return data;
};

interface DocumentProps {
	children: React.ReactNode;
	title?: string;
	preferredColorScheme: ColorScheme;
}

export const Document = ({
	children,
	title,
	preferredColorScheme,
}: DocumentProps) => {
	const [colorScheme, setColorScheme] =
		useState<ColorScheme>(preferredColorScheme);
	const updateThemeCookie = useFetcher().submit;
	const toggleColorScheme = (value?: ColorScheme) => {
		const scheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
		setColorScheme(scheme);
		updateThemeCookie(
			{ theme: scheme },
			{ method: 'post', action: '/actions/theme' }
		);
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
	const { colorScheme, headerColorScheme } = useLoaderData();
	const preferredColorScheme = colorScheme ?? headerColorScheme;

	return (
		<Document preferredColorScheme={preferredColorScheme}>
			<Outlet />
		</Document>
	);
}

export const shouldRevalidate = () => false;
