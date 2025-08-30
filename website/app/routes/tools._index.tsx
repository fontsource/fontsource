import { SimpleGrid } from '@mantine/core';
import { IconTransform } from '@tabler/icons-react';
import type { MetaFunction } from 'react-router';
import { ToolCard } from '@/components/tools/ToolCard';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Developer Tools | Fontsource';
	const description =
		'A collection of free, browser-based tools for web developers and designers to work with fonts, including a webfont converter and more.';

	return ogMeta({ title, description });
};

const tools = [
	{
		title: 'Font Converter',
		description: 'Convert TTF, OTF, WOFF, and WOFF2 files in your browser.',
		link: '/tools/converter',
		icon: IconTransform,
	},
];

export default function ToolsIndexPage() {
	const items = tools.map((tool) => (
		<ToolCard
			key={tool.title}
			title={tool.title}
			description={tool.description}
			link={tool.link}
			icon={tool.icon}
		/>
	));

	return (
		<SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="xl">
			{items}
		</SimpleGrid>
	);
}
