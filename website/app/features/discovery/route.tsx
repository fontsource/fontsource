import type { MetaFunction } from 'react-router';

import { CatalogSearchPage, links } from '@/routes/_index';
import { getCanonicalUrl, ogMeta } from '@/utils/meta';
import type { loader } from './loader.server';

export { links };

export const meta: MetaFunction<typeof loader> = ({ loaderData, location }) => {
	const page = loaderData?.discovery;
	if (!page) return ogMeta({});

	return [
		...ogMeta({
			title: `${page.heading} | Fontsource`,
			description: page.description,
		}),
		...(location.search
			? [{ name: 'robots', content: 'noindex, follow' }]
			: []),
		{
			'script:ld+json': {
				'@context': 'https://schema.org',
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: 'Browse',
						item: getCanonicalUrl('/browse'),
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: page.label,
						item: getCanonicalUrl(page.path),
					},
				],
			},
		},
	];
};

export default CatalogSearchPage;
