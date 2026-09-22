import { Stack, Text, Title } from '@mantine/core';
import { Link, type MetaFunction } from 'react-router';
import { FontWorkbench } from '@/components/tools/FontWorkbench';
import { getCanonicalUrl, ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => [
	...ogMeta({
		title: 'Webfont Optimizer — Subset and Compress Fonts | Fontsource',
		description:
			'Subset and compress fonts in your browser. Choose the characters to keep, then download WOFF2 files and matching CSS.',
	}),
	{
		'script:ld+json': {
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{
					'@type': 'ListItem',
					position: 1,
					name: 'Font Tools',
					item: getCanonicalUrl('/tools'),
				},
				{
					'@type': 'ListItem',
					position: 2,
					name: 'Webfont Optimizer',
					item: getCanonicalUrl('/tools/optimizer'),
				},
			],
		},
	},
];

export default function OptimizerPage() {
	return (
		<>
			<FontWorkbench preset="optimizer" />
			<Stack component="section" mt="xl" maw="65ch" gap="sm">
				<Title order={2} size="h3">
					Smaller webfonts with font subsetting
				</Title>
				<Text>
					Font subsetting removes characters you do not need. Choose character
					sets for a website or exact text for a logo or heading, then download
					WOFF2 files and matching @font-face CSS. Savings depend on your fonts
					and selection.
				</Text>
				<Text>
					Only need a different file format? Use the{' '}
					<Link to="/tools/converter">font converter</Link>.
				</Text>
			</Stack>
		</>
	);
}
