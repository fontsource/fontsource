import type { LoaderFunctionArgs, MetaFunction } from 'react-router';

import { CatalogSearchPage, links, loadSearch } from '@/routes/_index';
import { cacheHeaders } from '@/utils/cache';
import { loadDiscoveryPages } from '@/utils/discovery.server';
import { getCanonicalUrl, ogMeta } from '@/utils/meta';

export { links };

export const loader = async (args: LoaderFunctionArgs) => {
	const pathname = args.params.language
		? `/languages/${args.params.language}`
		: args.params.category
			? `/categories/${args.params.category}`
			: '/variable-fonts';
	const page = (await loadDiscoveryPages(args.request.signal)).find(
		(item) => item.path === pathname,
	);
	if (!page) {
		throw new Response('Not found', {
			status: 404,
			headers: cacheHeaders.noStore,
		});
	}

	return loadSearch(args, page);
};

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
						name: page.heading,
						item: getCanonicalUrl(page.path),
					},
				],
			},
		},
	];
};

export default CatalogSearchPage;
