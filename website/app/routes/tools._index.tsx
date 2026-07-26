import { SimpleGrid } from '@mantine/core';
import { IconBolt, IconTransform } from '@tabler/icons-react';
import type { MetaFunction } from 'react-router';
import { ToolCard } from '@/components/tools/ToolCard';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Font Tools | Fontsource';
	const description =
		'Browser-based tools for converting TTF, OTF, WOFF, and WOFF2 files, compressing web fonts, and generating @font-face CSS. No uploads.';

	return ogMeta({ title, description });
};

const tools = [
	{
		title: 'Font Converter',
		description: 'Convert TTF, OTF, WOFF, and WOFF2 files.',
		link: '/tools/converter',
		icon: IconTransform,
	},
	{
		title: 'Webfont Optimizer',
		description: 'Build compressed WOFF2 files and @font-face CSS.',
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
