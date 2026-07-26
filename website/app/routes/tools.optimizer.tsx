import type { MetaFunction } from 'react-router';
import { FontWorkbench } from '@/components/tools/FontWorkbench';
import { getCanonicalUrl, ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => [
	...ogMeta({
		title: 'Webfont Optimizer — WOFF2 & CSS | Fontsource',
		description:
			'Optimize TTF, OTF, WOFF, and WOFF2 fonts into compressed WOFF2 files with generated @font-face CSS. Review savings and download a ready-to-host package.',
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
	return <FontWorkbench preset="optimizer" />;
}
