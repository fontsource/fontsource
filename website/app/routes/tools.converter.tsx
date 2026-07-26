import type { MetaFunction } from 'react-router';
import { FontWorkbench } from '@/components/tools/FontWorkbench';
import { getCanonicalUrl, ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Font Converter — TTF, OTF, WOFF & WOFF2 | Fontsource';
	const description =
		'Convert TTF, OTF, WOFF, and WOFF2 files in your browser. Choose output formats, inspect filenames and sizes, then download individual files or a ZIP.';

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
