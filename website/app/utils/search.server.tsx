import { observable } from '@legendapp/state';
import { MantineProvider } from '@mantine/core';
import { renderToString } from 'react-dom/server';
import {
	Configure,
	getServerState,
	InstantSearch,
	type InstantSearchServerState,
	InstantSearchSSRProvider,
} from 'react-instantsearch';
import { data, type LoaderFunctionArgs, StaticRouter } from 'react-router';
import type { SearchFacets } from '@/components/search/Dropdowns';
import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import { CollectionsProvider } from '@/features/collections/CollectionsProvider';
import {
	getRegistryTaxonomy,
	listRegistryFamilies,
	listRegistryLanguages,
} from '@/generated/api';
import { theme } from '@/styles/theme';
import { buildAlgoliaCacheKey } from '@/utils/algolia';
import { DEFAULT_SEARCH_INDEX, searchClient } from '@/utils/algolia-client';
import { cacheHeaders, PUBLIC_ORIGIN } from '@/utils/cache';
import { cloudflareContext } from '@/utils/cloudflare-context';
import type { DiscoveryPage } from '@/utils/discovery';
import type { DiscoveryRegistry } from '@/utils/discovery.server';
import type { FontPreview } from '@/utils/font-summary';
import {
	attributesToRetrieve,
	createPageSearchState,
	hitsPerPage,
	routing,
	type SearchProps,
} from '@/utils/search-config';

const ALGOLIA_TTL_SECONDS = 6 * 60 * 60; // 6 hours

const getSearchServerState = (
	serverUrl: string,
	facets: SearchFacets,
	discovery?: DiscoveryPage,
	previews: Record<string, FontPreview> = {},
) => {
	const state$ = observable(createPageSearchState(discovery));
	const requestUrl = new URL(serverUrl);

	return getServerState(
		<StaticRouter location={`${requestUrl.pathname}${requestUrl.search}`}>
			<MantineProvider theme={theme}>
				<InstantSearchSSRProvider>
					<InstantSearch
						searchClient={searchClient}
						indexName={DEFAULT_SEARCH_INDEX}
						routing={routing(serverUrl, state$, discovery)}
						future={{ preserveSharedStateOnUnmount: true }}
					>
						<CollectionsProvider>
							<Configure
								attributesToRetrieve={attributesToRetrieve}
								hitsPerPage={hitsPerPage}
							/>
							<Filters state$={state$} {...facets} />
							<InfiniteHits
								state$={state$}
								previews={previews}
								languages={facets.languages}
							/>
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
	discovery?: DiscoveryPage,
	registry?: DiscoveryRegistry,
) => {
	const options = { signal: request.signal };
	const [families, languages, taxonomy] = await Promise.all([
		registry?.families ?? listRegistryFamilies(options),
		listRegistryLanguages(options),
		registry?.taxonomy ?? getRegistryTaxonomy(options),
	]);
	const facets = { languages, taxonomy };
	const requestUrl = new URL(request.url);
	const serverUrl = `${PUBLIC_ORIGIN}${requestUrl.pathname}${requestUrl.search}`;
	const hasCollectionFilter = requestUrl.searchParams.has('collection');
	const previews = Object.fromEntries(
		families
			.filter(
				(family) =>
					family.sampleText ||
					family.previewSubset ||
					family.previewContext ||
					family.primaryLanguage ||
					(family.primaryScript && family.primaryScript !== 'Latn'),
			)
			.map(
				({
					id,
					sampleText,
					previewSubset,
					previewContext,
					primaryLanguage,
					primaryScript,
				}) => [
					id,
					{
						sampleText,
						previewSubset,
						previewContext,
						primaryLanguage,
						primaryScript,
					},
				],
			),
	);
	// Collection membership exists only in localStorage and is unavailable to SSR.
	if (hasCollectionFilter) {
		return data<SearchProps>(
			{
				discovery,
				hasCollectionFilter,
				serverUrl,
				previews,
				...facets,
			},
			{ headers: cacheHeaders.short },
		);
	}

	const { env, ctx } = context.get(cloudflareContext);
	const { ALGOLIA } = env;
	const cacheKey = await buildAlgoliaCacheKey(serverUrl);

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
				...facets,
			},
			{
				headers: cacheHeaders.short,
			},
		);
	}

	serverState = await getSearchServerState(
		serverUrl,
		facets,
		discovery,
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
			...facets,
		},
		{
			headers: cacheHeaders.short,
		},
	);
};

export const loader = (args: LoaderFunctionArgs) => loadSearch(args);
