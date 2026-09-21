import { IconBolt, IconTransform } from '@tabler/icons-react';
import type { MetaFunction } from 'react-router';
import { ToolCard } from '@/components/tools/ToolCard';
import classes from '@/styles/tools.module.css';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Font Tools | Fontsource';
	const description =
		'Browser-based tools for converting TTF, OTF, WOFF, and WOFF2 files, subsetting and compressing web fonts, and generating @font-face CSS. No uploads.';

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
		description:
			'Subset fonts by character set or text. Download WOFF2 and CSS.',
		link: '/tools/optimizer',
		icon: IconBolt,
	},
];

export default function ToolsIndexPage() {
	return (
		<div className={classes.page}>
			<header className={classes.header}>
				<h1>Font tools</h1>
				<p>
					Convert font files or prepare them for your website. Everything runs
					in your browser.
				</p>
			</header>
			<div className={classes.directory}>
				{tools.map((tool) => (
					<ToolCard
						key={tool.title}
						title={tool.title}
						description={tool.description}
						link={tool.link}
						icon={tool.icon}
					/>
				))}
			</div>
		</div>
	);
}
