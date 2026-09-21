import { createFetchRequester } from '@algolia/requester-fetch';
import { liteClient as algoliasearch } from 'algoliasearch/lite';
import type { SearchClient, UiState } from 'instantsearch.js';
import { history } from 'instantsearch.js/es/lib/routers';
import type { BrowserHistoryArgs } from 'instantsearch.js/es/lib/routers/history';
import type { RouterProps } from 'instantsearch.js/es/middlewares';
import type { InstantSearchServerState } from 'react-instantsearch';

import {
	createSearchState,
	type SearchState,
} from '@/components/search/observables';
import type { DiscoveryPage } from '@/utils/discovery';
import type { FontPreview } from '@/utils/font-summary';
import { getPreviewText } from '@/utils/language/language';

export interface SearchProps {
	previews: Record<string, FontPreview>;
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

const ALGOLIA_APP_ID = 'WNATE69PVR';
const attributesToRetrieve = ['family', 'defSubset', 'category', 'variable'];

const searchClient: SearchClient = algoliasearch(
	ALGOLIA_APP_ID,
	'8b36fe56fca654afaeab5e6f822c14bd',
	{
		requester: createFetchRequester(),
	},
);

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

const createPageSearchState = (
	discovery?: DiscoveryPage,
): ReturnType<typeof createSearchState> => {
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
			cleanUrlOnDispose: false,
		} satisfies Partial<BrowserHistoryArgs<SearchRouteState>>),
		stateMapping: {
			stateToRoute(uiState) {
				const index = uiState[indexName];
				const collectionId = state$.collectionId.peek();
				const result = {
					query: index.query,
					...(collectionId ? { collection: collectionId } : {}),
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
				state$.collectionId.set(resolvedRouteState.collection ?? null);

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

export {
	ALGOLIA_APP_ID,
	attributesToRetrieve,
	createPageSearchState,
	routing,
	searchClient,
};
