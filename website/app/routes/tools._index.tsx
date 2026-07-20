import { SimpleGrid } from '@mantine/core';
import { IconBolt, IconTransform } from '@tabler/icons-react';
import type { MetaFunction } from 'react-router';
import { ToolCard } from '@/components/tools/ToolCard';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Developer Tools | Fontsource';
	const description =
		'Free browser-based font tools for web developers and designers, including a private webfont converter and WOFF2 optimizer with CSS generation.';

	return ogMeta({ title, description });
};

const tools = [
	{
		title: 'Font Converter',
		description: 'Convert TTF, OTF, WOFF, and WOFF2 files in your browser.',
		link: '/tools/converter',
		icon: IconTransform,
	},
	{
		title: 'Webfont Optimizer',
		description: 'Create compressed WOFF2 webfonts and ready-to-use CSS.',
		link: '/tools/optimizer',
		icon: IconBolt,
	},
];

export default function ToolsIndexPage() {
	return (
		<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
			{tools.map((tool) => (
				<ToolCard
					key={tool.title}
					title={tool.title}
					description={tool.description}
					link={tool.link}
					icon={tool.icon}
				/>
			))}
		</SimpleGrid>
	);
}
