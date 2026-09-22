import type { MetaFunction } from 'react-router';
import { FontWorkbench } from '@/components/tools/FontWorkbench';
import { getCanonicalUrl, ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Font Converter — TTF, OTF, WOFF & WOFF2 | Fontsource';
	const description =
		'Convert TTF, OTF, WOFF, or WOFF2 files to WOFF2, WOFF, or TTF for websites and design apps. Your fonts stay in your browser.';

	return [
		...ogMeta({ title, description }),
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
						name: 'Font Converter',
						item: getCanonicalUrl('/tools/converter'),
					},
				],
			},
		},
	];
};

export const ConverterPage = () => {
	return <FontWorkbench preset="converter" />;
};

export default ConverterPage;
