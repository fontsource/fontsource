import { createFetchRequester } from '@algolia/requester-fetch';
import { observable } from '@legendapp/state';
import { useObservable, useValue } from '@legendapp/state/react';
import { Box, MantineProvider, Stack, Text, Title } from '@mantine/core';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import type { UiState } from 'instantsearch.js';
import { history } from 'instantsearch.js/es/lib/routers';
import type { BrowserHistoryArgs } from 'instantsearch.js/es/lib/routers/history';
import type { RouterProps } from 'instantsearch.js/es/middlewares';
import { useRef } from 'react';
import { renderToString } from 'react-dom/server';
import {
	Configure,
	getServerState,
	InstantSearch,
	type InstantSearchServerState,
	InstantSearchSSRProvider,
} from 'react-instantsearch';
import {
	data,
	type LinksFunction,
	type LoaderFunctionArgs,
	type MetaFunction,
	useLoaderData,
	useNavigate,
	useNavigation,
} from 'react-router';

import { Breadcrumbs } from '@/components/docs/Breadcrumbs';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import {
	createSearchState,
	type SearchState,
} from '@/components/search/observables';
import { ScrollToTop } from '@/components/search/ScrollToTop';
import {
	CollectionsProvider,
	useCollectionsStore,
} from '@/features/collections/CollectionsProvider';
import { normalizeCollectionName } from '@/features/collections/model';
import type { CollectionsStore } from '@/features/collections/store';
import classes from '@/styles/global.module.css';
import { theme } from '@/styles/theme';
import { buildAlgoliaCacheKey } from '@/utils/algolia';
import { cacheHeaders, PUBLIC_ORIGIN } from '@/utils/cache';
import { cloudflareContext } from '@/utils/cloudflare-context';
import type { DiscoveryPage } from '@/utils/discovery';
import { getPreviewText } from '@/utils/language/language';

export interface SearchProps {
	discovery?: DiscoveryPage;
	hasCollectionFilter: boolean;
	serverState?: InstantSearchServerState;
	serverUrl: string;
}

interface SearchRouteState {
	category?: string;
	collection?: string;
	query?: string;
	sort?: string;
	subsets?: string | string[];
	variable?: boolean;
}

const ALGOLIA_TTL_SECONDS = 6 * 60 * 60; // 6 hours
const ALGOLIA_APP_ID = 'WNATE69PVR';
const attributesToRetrieve = ['family', 'defSubset', 'category', 'variable'];

const searchClient = algoliasearch(
	ALGOLIA_APP_ID,
	'8b36fe56fca654afaeab5e6f822c14bd',
	{
		requester: createFetchRequester(),
	},
);

export const links: LinksFunction = () => [
	{
		rel: 'preconnect',
		href: `https://${ALGOLIA_APP_ID}-dsn.algolia.net`,
		crossOrigin: 'anonymous',
	},
];

export const meta: MetaFunction = ({ location }) =>
	location.search ? [{ name: 'robots', content: 'noindex, follow' }] : [];

const sortMap: Record<string, string> = {
	prod_POPULAR: 'popular',
	prod_NEWEST: 'newest',
	prod_NAME: 'name',
	prod_RANDOM: 'random',

	popular: 'prod_POPULAR',
	newest: 'prod_NEWEST',
	name: 'prod_NAME',
	random: 'prod_RANDOM',
};

const parseSubsets = (value: unknown): string[] | undefined => {
	const subsets = (Array.isArray(value) ? value : [value])
		.filter((subset): subset is string => typeof subset === 'string')
		// Split comma-separated values and flatten the resulting arrays.
		.flatMap((subset) => subset.split(',').filter(Boolean));

	return subsets.length > 0 ? subsets : undefined;
};

const createPageSearchState = (discovery?: DiscoveryPage) => {
	const state = createSearchState();
	const subset = discovery?.routeState.subsets;
	if (subset) {
		state.language = subset;
		state.preview.presetValue = getPreviewText(subset);
	}

	return state;
};

const routing = (
	serverUrl: string,
	state$: SearchState,
	collectionsStore?: CollectionsStore,
	discovery?: DiscoveryPage,
	navigate?: (url: string) => void,
): RouterProps<UiState, SearchRouteState> => {
	const indexName = 'prod_POPULAR';
	return {
		router: history({
			getLocation: () => {
				return typeof window === 'undefined'
					? (new URL(serverUrl) as unknown as Location)
					: window.location;
			},
			createURL: ({ qsModule, routeState }) => {
				const query = qsModule.stringify(routeState);
				if (discovery && query === qsModule.stringify(discovery.routeState)) {
					return discovery.path;
				}

				return query ? `/?${query}` : '/';
			},
			parseURL: ({ qsModule, location }) => {
				const routeState = qsModule.parse(location.search.slice(1), {
					arrayLimit: 99,
				}) as SearchRouteState;

				return discovery
					? { ...discovery.routeState, ...routeState }
					: routeState;
			},
			...(navigate ? { push: (url: string) => void navigate(url) } : {}),
			cleanUrlOnDispose: !discovery,
		} satisfies Partial<BrowserHistoryArgs<SearchRouteState>>),
		stateMapping: {
			stateToRoute(uiState) {
				const index = uiState[indexName];
				// Collection selection lives in Legend rather than InstantSearch state.
				const collectionId = state$.collectionId.peek();
				const collectionName = collectionsStore?.collections$
					.peek()
					.find((collection) => collection.id === collectionId)?.name;
				const result = {
					query: index.query,
					...(collectionName ? { collection: collectionName } : {}),
					// RefinementList facets
					...(index.refinementList?.subsets
						? { subsets: index.refinementList.subsets.join(',') }
						: {}),
					// Menu facets
					...(index.menu?.category ? { category: index.menu.category } : {}),
					// Variable toggle
					...(index.toggle?.variable === true ? { variable: true } : {}),
					// Sortby map
					...(index.sortBy ? { sort: sortMap[index.sortBy] } : {}),
				};
				return result;
			},
			routeToState(routeState) {
				const resolvedRouteState = discovery
					? { ...discovery.routeState, ...routeState }
					: routeState;
				const subsets = parseSubsets(resolvedRouteState.subsets);
				// URLs use readable collection names while state keeps the stable local ID.
				const normalizedCollectionName = resolvedRouteState.collection
					? normalizeCollectionName(resolvedRouteState.collection)
					: undefined;
				const collection = collectionsStore?.collections$
					.peek()
					.find(
						(item) =>
							normalizeCollectionName(item.name) === normalizedCollectionName,
					);
				state$.collectionId.set(collection?.id ?? null);

				const state = {
					query: resolvedRouteState.query,
					// RefinementList facets
					...(subsets?.length ? { refinementList: { subsets } } : {}),
					// Menu facets
					...(resolvedRouteState.category
						? { menu: { category: resolvedRouteState.category } }
						: {}),
					// Variable toggle
					...(resolvedRouteState.variable
						? { toggle: { variable: true } }
						: {}),
					// Sortby map
					...(resolvedRouteState.sort
						? {
								sortBy: sortMap[resolvedRouteState.sort],
							}
						: {}),
				};
				const result = {
					[indexName]: state,
				};
				return result;
			},
		},
	};
};

export const loadSearch = async (
	{ request, context }: LoaderFunctionArgs,
	discovery?: DiscoveryPage,
) => {
	const requestUrl = new URL(request.url);
	const serverUrl = `${PUBLIC_ORIGIN}${requestUrl.pathname}${requestUrl.search}`;
	const hasCollectionFilter = requestUrl.searchParams.has('collection');
	// Collection membership exists only in localStorage and is unavailable to SSR.
	if (hasCollectionFilter) {
		return data<SearchProps>(
			{ discovery, hasCollectionFilter, serverUrl },
			{ headers: cacheHeaders.short },
		);
	}

	const { env, ctx } = context.get(cloudflareContext);
	const { ALGOLIA } = env;
	const cacheKey = buildAlgoliaCacheKey(serverUrl);

	// Generate default state object for ssr
	const state$ = observable(createPageSearchState(discovery));

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
			},
			{
				headers: cacheHeaders.short,
			},
		);
	}

	serverState = await getServerState(
		<MantineProvider theme={theme}>
			<InstantSearchSSRProvider>
				<InstantSearch
					searchClient={searchClient}
					indexName="prod_POPULAR"
					routing={routing(serverUrl, state$, undefined, discovery)}
					future={{ preserveSharedStateOnUnmount: true }}
				>
					<CollectionsProvider>
						<Configure attributesToRetrieve={attributesToRetrieve} />
						<Filters state$={state$} />
						<InfiniteHits state$={state$} />
					</CollectionsProvider>
				</InstantSearch>
			</InstantSearchSSRProvider>
		</MantineProvider>,
		{
			renderToString,
		},
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
		},
		{
			headers: cacheHeaders.short,
		},
	);
};

export const loader = (args: LoaderFunctionArgs) => loadSearch(args);

export function CatalogSearchPage() {
	const { discovery, hasCollectionFilter, serverState, serverUrl } =
		useLoaderData<SearchProps>();
	const collectionsStore = useCollectionsStore();
	const collectionsReady = useValue(collectionsStore.ready$);
	const navigate = useNavigate();
	const navigation = useNavigation();
	const navigationState = useRef(navigation.state);
	const searchRef = useRef<HTMLDivElement>(null);
	navigationState.current = navigation.state;
	// Ignore delayed search URL writes once React Router is leaving this page.
	const navigateSearch = (url: string) => {
		if (navigationState.current === 'idle') void navigate(url);
	};

	const state$ = useObservable(createPageSearchState(discovery));
	// Resolve the collection name only after Legend has restored local persistence.
	if (hasCollectionFilter && !collectionsReady) return null;

	return (
		<InstantSearchSSRProvider {...serverState}>
			<InstantSearch
				searchClient={searchClient}
				indexName="prod_POPULAR"
				routing={routing(
					serverUrl,
					state$,
					collectionsStore,
					discovery,
					discovery ? navigateSearch : undefined,
				)}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Configure attributesToRetrieve={attributesToRetrieve} />
				{discovery && (
					<ContentHeader mih={0} pt={40} pb={24}>
						<Stack gap="xs" maw={760}>
							<Breadcrumbs
								items={[
									{ name: 'Browse', url: '/browse' },
									{ name: discovery.label },
								]}
							/>
							<Title order={1} c="purple.0">
								{discovery.heading}
							</Title>
							<Text>{discovery.intro}</Text>
						</Stack>
					</ContentHeader>
				)}
				<Box className={classes.background}>
					<Box
						className={classes.container}
						pt={discovery ? 24 : undefined}
						ref={searchRef}
					>
						<Filters state$={state$} />
					</Box>
				</Box>
				<Box className={classes.container}>
					<InfiniteHits state$={state$} />
					<ScrollToTop containerId="#hits" targetRef={searchRef} />
				</Box>
			</InstantSearch>
		</InstantSearchSSRProvider>
	);
}

export default function Index() {
	return <CatalogSearchPage />;
}
