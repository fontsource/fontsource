import type { LoaderFunctionArgs } from 'react-router';
import { listRegistryFamilies } from '@/generated/api';
import { cacheHeaders } from '@/utils/cache';
import { loadDiscoveryPages } from '@/utils/discovery.server';
import { loadSearch } from '@/utils/search.server';

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

	return loadSearch(
		args,
		await listRegistryFamilies({ signal: args.request.signal }),
		page,
	);
};
