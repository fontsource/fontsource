import type { MetaFunction } from 'react-router';
import { FontWorkbench } from '@/components/tools/FontWorkbench';
import { getCanonicalUrl, ogMeta } from '@/utils/meta';

export const meta: MetaFunction = () => {
	const title = 'Font Converter — TTF, OTF, WOFF & WOFF2 | Fontsource';
	const description =
		'Convert TTF to WOFF2, OTF to TTF, WOFF2 to TTF, and other supported font formats in your browser. Free, with no uploads.';

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
