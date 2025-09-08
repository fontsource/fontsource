import '@fontsource-variable/ibm-plex-sans/wght.css';
import '@fontsource-variable/source-code-pro/wght.css';
import 'fallback-font/fallback-outline.css';
// Common
import '@mantine/core/styles/baseline.css';
import '@mantine/core/styles/default-css-variables.css';
import '@mantine/core/styles/global.css';
import '@mantine/core/styles/ScrollArea.css';
import '@mantine/core/styles/UnstyledButton.css';
import '@mantine/core/styles/VisuallyHidden.css';
import '@mantine/core/styles/Popover.css';
import '@mantine/core/styles/Group.css';
import '@mantine/core/styles/ModalBase.css';
import '@mantine/core/styles/Input.css';
import '@mantine/core/styles/Flex.css';
import '@mantine/core/styles/InlineInput.css';
import '@mantine/core/styles/FloatingIndicator.css';
import '@mantine/core/styles/ColorSwatch.css';
import '@mantine/core/styles/ColorPicker.css';
// Layout
import '@mantine/core/styles/Grid.css';
import '@mantine/core/styles/SimpleGrid.css';
import '@mantine/core/styles/Container.css';
import '@mantine/core/styles/Stack.css';
// Inputs
import '@mantine/core/styles/Checkbox.css';
import '@mantine/core/styles/ColorInput.css';
import '@mantine/core/styles/SegmentedControl.css';
import '@mantine/core/styles/Slider.css';
import '@mantine/core/styles/Combobox.css';
// Buttons
import '@mantine/core/styles/ActionIcon.css';
import '@mantine/core/styles/Button.css';
// Navigation
import '@mantine/core/styles/Burger.css';
import '@mantine/core/styles/NavLink.css';
import '@mantine/core/styles/Tabs.css';
// Feedback
import '@mantine/core/styles/Progress.css';
import '@mantine/core/styles/Skeleton.css';
// Overlays
import '@mantine/core/styles/Menu.css';
import '@mantine/core/styles/Modal.css';
import '@mantine/core/styles/Tooltip.css';
// Typography
import '@mantine/core/styles/Code.css';
import '@mantine/core/styles/List.css';
import '@mantine/core/styles/Table.css';
// Misc
import '@mantine/core/styles/Badge.css';
import '@mantine/core/styles/Card.css';
import '@mantine/core/styles/Divider.css';
import '@mantine/core/styles/Text.css';
import '@mantine/core/styles/Title.css';
// Extensions
import '@mantine/dropzone/styles.css';
import '@/styles/global.css';

import ibmLatinURL from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2?url';
import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import type {
	HeadersFunction,
	LinksFunction,
	MetaFunction,
} from 'react-router';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import { ErrorBoundary as ErrorBoundaryComponent } from '@/components/ErrorBoundary';
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
		rel: 'preload',
		as: 'font',
		type: 'font/woff2',
		crossOrigin: 'anonymous',
		href: ibmLatinURL,
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
		rel: 'icon',
		href: '/favicon.ico',
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
				<ColorSchemeScript
					defaultColorScheme="light"
					suppressHydrationWarning
				/>
				<script defer src="https://demo.medama.io/script.js" />
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

export function ErrorBoundary() {
	return (
		<Document>
			<ErrorBoundaryComponent />
		</Document>
	);
}
