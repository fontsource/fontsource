import type { UiState } from 'instantsearch.js';
import { history } from 'instantsearch.js/es/lib/routers';
import type { BrowserHistoryArgs } from 'instantsearch.js/es/lib/routers/history';
import type { RouterProps } from 'instantsearch.js/es/middlewares';
import type { InstantSearchServerState } from 'react-instantsearch';
import type { SearchFacets } from '@/components/search/Dropdowns';
import {
	createSearchState,
	type SearchState,
} from '@/components/search/observables';
import type { GetRegistryLanguageIndexResponse } from '@/generated/api';
import { DEFAULT_SEARCH_INDEX } from '@/utils/algolia-client';
import type { DiscoveryPage } from '@/utils/discovery';
import type { FontPreview } from '@/utils/font-summary';
import { getPreviewText } from '@/utils/language/language';

export interface SearchProps extends SearchFacets {
	languageIndex: GetRegistryLanguageIndexResponse | null;
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
	classifications?: string | string[];
	tags?: string | string[];
	languages?: string | string[];
	variable?: boolean;
}

const attributesToRetrieve = [
	'family',
	'defSubset',
	'category',
	'variable',
	'languageIndexVersion',
];

const sortMap: Record<string, string> = {
	[DEFAULT_SEARCH_INDEX]: 'popular',
	prod_NEWEST: 'newest',
	prod_NAME: 'name',
	prod_RANDOM: 'random',

	popular: DEFAULT_SEARCH_INDEX,
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
	const indexName = DEFAULT_SEARCH_INDEX;
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
					...(index.refinementList?.subsets?.length
						? { subsets: index.refinementList.subsets.join(',') }
						: {}),
					...(index.refinementList?.classifications?.length
						? {
								classifications: index.refinementList.classifications.join(','),
							}
						: {}),
					...(index.refinementList?.tags?.length
						? { tags: index.refinementList.tags.join(',') }
						: {}),
					...(index.refinementList?.languageIds?.length
						? { languages: index.refinementList.languageIds.join(',') }
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
				const classifications = parseSubsets(
					resolvedRouteState.classifications,
				);
				const tags = parseSubsets(resolvedRouteState.tags);
				const languageIds = parseSubsets(resolvedRouteState.languages);
				state$.collectionId.set(resolvedRouteState.collection ?? null);

				const state = {
					query: resolvedRouteState.query,
					// RefinementList facets
					refinementList: {
						...(subsets?.length ? { subsets } : {}),
						...(classifications?.length ? { classifications } : {}),
						...(tags?.length ? { tags } : {}),
						...(languageIds?.length ? { languageIds } : {}),
					},
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

export { attributesToRetrieve, createPageSearchState, routing };
