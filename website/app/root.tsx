import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/source-code-pro/wght.css';
import 'fallback-font/fallback-outline.css';
// Common
import '@mantine/core/styles/global.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/UnstyledButton.css';
import '@mantine/core/styles/VisuallyHidden.css';
import '@mantine/core/styles/Popover.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/Input.css';
import '@mantine/core/styles/Flex.css';
// Layout
import '@mantine/core/styles/Grid.css';
import '@mantine/core/styles/SimpleGrid.css';
import '@mantine/core/styles/Container.css';
import '@mantine/core/styles/Stack.css';
import '@mantine/core/styles/Center.css';
// Inputs
import '@mantine/core/styles/Checkbox.css';
import '@mantine/core/styles/SegmentedControl.css';
import '@mantine/core/styles/Slider.css';
import '@mantine/core/styles/Combobox.css';
// Buttons
import '@mantine/core/styles/ActionIcon.css';
import '@mantine/core/styles/Button.css';
// Navigation
import '@mantine/core/styles/NavLink.css';
import '@mantine/core/styles/Tabs.css';
// Feedback
import '@mantine/core/styles/Skeleton.css';
// Overlays
import '@mantine/core/styles/Tooltip.css';
import '@mantine/core/styles/Badge.css';
// Typography
import '@mantine/core/styles/Code.css';
import '@mantine/core/styles/Table.css';
// Misc
import '@mantine/core/styles/Text.css';
import '@mantine/core/styles/Title.css';
import '@mantine/core/styles/Divider.css';
import '@/styles/global.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type {
	HeadersFunction,
	LinksFunction,
	MetaFunction,
} from '@remix-run/node';
import {
	Links,
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
