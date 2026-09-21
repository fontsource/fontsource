import type { LoaderFunctionArgs } from 'react-router';
import { cacheHeaders } from '@/utils/cache';
import { loadDiscoveryData } from '@/utils/discovery.server';
import { loadSearch } from '@/utils/search.server';

export const loader = async (args: LoaderFunctionArgs) => {
	const pathname =
		args.params.group && args.params.tag
			? `/tags/${args.params.group}/${args.params.tag}`
			: args.params.language
				? `/languages/${args.params.language}`
				: args.params.category
					? `/categories/${args.params.category}`
					: '/variable-fonts';
	const { pages, registry } = await loadDiscoveryData(
		args.request.signal,
		pathname,
	);
	const page = pages.find((item) => item.path === pathname);
	if (!page) {
		throw new Response('Not found', {
			status: 404,
			headers: cacheHeaders.noStore,
		});
	}

	return loadSearch(args, page, registry);
};
