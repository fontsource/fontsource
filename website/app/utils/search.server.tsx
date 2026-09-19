import { observable } from '@legendapp/state';
import { MantineProvider } from '@mantine/core';
import type { SearchClient } from 'instantsearch.js';
import { renderToString } from 'react-dom/server';
import {
	Configure,
	getServerState,
	InstantSearch,
	type InstantSearchServerState,
	InstantSearchSSRProvider,
} from 'react-instantsearch';
import { data, type LoaderFunctionArgs, StaticRouter } from 'react-router';

import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import { CollectionsProvider } from '@/features/collections/CollectionsProvider';
import { listRegistryFamilies } from '@/generated/api';
import { theme } from '@/styles/theme';
import { buildAlgoliaCacheKey } from '@/utils/algolia';
import { cacheHeaders, PUBLIC_ORIGIN } from '@/utils/cache';
import { cloudflareContext } from '@/utils/cloudflare-context';
import type { DiscoveryPage } from '@/utils/discovery';
import type { FontPreview } from '@/utils/font-summary';
import {
	attributesToRetrieve,
	createPageSearchState,
	routing,
	type SearchProps,
	searchClient,
} from '@/utils/search-config';

const ALGOLIA_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export const getSearchServerState = (
	serverUrl: string,
	discovery?: DiscoveryPage,
	client: SearchClient = searchClient,
	previews: Record<string, FontPreview> = {},
) => {
	const state$ = observable(createPageSearchState(discovery));
	const requestUrl = new URL(serverUrl);

	return getServerState(
		<StaticRouter location={`${requestUrl.pathname}${requestUrl.search}`}>
			<MantineProvider theme={theme}>
				<InstantSearchSSRProvider>
					<InstantSearch
						searchClient={client}
						indexName="prod_POPULAR"
						routing={routing(serverUrl, state$, discovery)}
						future={{ preserveSharedStateOnUnmount: true }}
					>
						<CollectionsProvider>
							<Configure attributesToRetrieve={attributesToRetrieve} />
							<Filters state$={state$} />
							<InfiniteHits state$={state$} previews={previews} />
						</CollectionsProvider>
					</InstantSearch>
				</InstantSearchSSRProvider>
			</MantineProvider>
		</StaticRouter>,
		{ renderToString },
	);
};

export const loadSearch = async (
	{ request, context }: LoaderFunctionArgs,
	families: readonly (FontPreview & { id: string })[],
	discovery?: DiscoveryPage,
) => {
	const requestUrl = new URL(request.url);
	const serverUrl = `${PUBLIC_ORIGIN}${requestUrl.pathname}${requestUrl.search}`;
	const hasCollectionFilter = requestUrl.searchParams.has('collection');
	const previews = Object.fromEntries(
		families
			.filter(
				(family) =>
					family.sampleText || family.previewSubset || family.previewContext,
			)
			.map(({ id, sampleText, previewSubset, previewContext }) => [
				id,
				{ sampleText, previewSubset, previewContext },
			]),
	);
	// Collection membership exists only in localStorage and is unavailable to SSR.
	if (hasCollectionFilter) {
		return data<SearchProps>(
			{ discovery, hasCollectionFilter, serverUrl, previews },
			{ headers: cacheHeaders.short },
		);
	}

	const { env, ctx } = context.get(cloudflareContext);
	const { ALGOLIA } = env;
	const cacheKey = buildAlgoliaCacheKey(serverUrl);

	// Check local cache for server state first to avoid unnecessary API calls
	let serverState = cacheKey
		? await ALGOLIA.get<InstantSearchServerState>(cacheKey, 'json')
		: null;
	if (serverState) {
		return data<SearchProps>(
			{
				discovery,
				hasCollectionFilter,
				serverState,
				serverUrl,
				previews,
			},
			{
				headers: cacheHeaders.short,
			},
		);
	}

	serverState = await getSearchServerState(
		serverUrl,
		discovery,
		searchClient,
		previews,
	);

	// Add server state to local cache before responding
	if (cacheKey) {
		ctx.waitUntil(
			ALGOLIA.put(cacheKey, JSON.stringify(serverState), {
				expirationTtl: ALGOLIA_TTL_SECONDS,
			}),
		);
	}

	return data<SearchProps>(
		{
			discovery,
			hasCollectionFilter,
			serverState,
			serverUrl,
			previews,
		},
		{
			headers: cacheHeaders.short,
		},
	);
};

export const loader = async (args: LoaderFunctionArgs) =>
	loadSearch(args, await listRegistryFamilies({ signal: args.request.signal }));
