import type { LoaderFunctionArgs } from 'react-router';
import {
	getRegistryTaxonomy,
	listRegistryFamilies,
	listRegistryLanguages,
} from '@/generated/api';

import { loadSearch } from '@/routes/_index';
import { cacheHeaders } from '@/utils/cache';
import { loadDiscoveryPages } from '@/utils/discovery.server';

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

	const options = { signal: args.request.signal };
	const [families, languages, taxonomy] = await Promise.all([
		listRegistryFamilies(options),
		listRegistryLanguages(options),
		getRegistryTaxonomy(options),
	]);
	return loadSearch(args, families, { languages, taxonomy }, page);
};
