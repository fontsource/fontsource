import { IconBolt, IconTransform } from '@tabler/icons-react';
import type { MetaFunction } from 'react-router';
import { ToolCard } from '@/components/tools/ToolCard';
import classes from '@/styles/tools.module.css';
import { ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Font Tools | Fontsource';
	const description =
		'Convert TTF, OTF, WOFF, and WOFF2 fonts, subset characters, and compress webfonts with matching CSS. Free browser tools with no uploads.';

	return ogMeta({ title, description });
};

const tools = [
	{
		title: 'Font Converter',
		description:
			'Convert TTF, OTF, WOFF, and WOFF2 files to WOFF2, WOFF, or TTF.',
		link: '/tools/converter',
		icon: IconTransform,
	},
	{
		title: 'Webfont Optimizer',
		description:
			'Subset and compress fonts into WOFF2 files with matching CSS.',
		link: '/tools/optimizer',
		icon: IconBolt,
	},
];

export default function ToolsIndexPage() {
	return (
		<div className={classes.page}>
			<header className={classes.header}>
				<h1>Font Tools</h1>
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
