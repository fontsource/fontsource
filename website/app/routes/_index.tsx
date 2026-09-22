import { useObservable, useValue } from '@legendapp/state/react';
import { Box } from '@mantine/core';
import { useEffect, useRef } from 'react';
import {
	Configure,
	InstantSearch,
	InstantSearchSSRProvider,
} from 'react-instantsearch';
import {
	type HeadersFunction,
	type LinksFunction,
	type MetaFunction,
	type ShouldRevalidateFunctionArgs,
	useLoaderData,
	useLocation,
	useNavigate,
	useNavigation,
} from 'react-router';
import { ContentHeader } from '@/components/layout/ContentHeader';
import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import { ScrollToTop } from '@/components/search/ScrollToTop';
import { useCollectionsStore } from '@/features/collections/CollectionsProvider';
import classes from '@/styles/global.module.css';
import { HOME_DISCOVERY_LINKS } from '@/utils/agent-discovery';
import {
	ALGOLIA_APP_ID,
	DEFAULT_SEARCH_INDEX,
	searchClient,
} from '@/utils/algolia-client';
import { ogMeta } from '@/utils/meta';
import {
	attributesToRetrieve,
	createPageSearchState,
	hitsPerPage,
	routing,
	type SearchProps,
} from '@/utils/search-config';

export { loader } from '@/utils/search.server';

let previousSearch:
	| {
			key: string;
			state: ReturnType<typeof createPageSearchState>;
	  }
	| undefined;

export const shouldRevalidate = ({
	currentUrl,
	nextUrl,
	formMethod,
	defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs) => {
	// InstantSearch owns client-side refinements; keep its loaded pages in place.
	const isSearchOnlyNavigation =
		!formMethod &&
		currentUrl.pathname === nextUrl.pathname &&
		currentUrl.search !== nextUrl.search;

	return isSearchOnlyNavigation ? false : defaultShouldRevalidate;
};

export const links: LinksFunction = () => [
	{
		rel: 'preconnect',
		href: `https://${ALGOLIA_APP_ID}-dsn.algolia.net`,
		crossOrigin: 'anonymous',
	},
];

export const meta: MetaFunction = ({ location }) => [
	...ogMeta({}),
	...(location.search ? [{ name: 'robots', content: 'noindex, follow' }] : []),
];

export const headers: HeadersFunction = ({ parentHeaders }) => {
	for (const link of HOME_DISCOVERY_LINKS) {
		parentHeaders.append('Link', link);
	}

	return parentHeaders;
};

export function CatalogSearchPage() {
	const {
		discovery,
		hasCollectionFilter,
		serverState,
		serverUrl,
		previews,
		languages,
		taxonomy,
	} = useLoaderData<SearchProps>();
	const collectionsStore = useCollectionsStore();
	const collectionsReady = useValue(collectionsStore.ready$);
	const navigate = useNavigate();
	const location = useLocation();
	const navigation = useNavigation();
	const navigationState = useRef(navigation.state);
	const searchRef = useRef<HTMLDivElement>(null);
	navigationState.current = navigation.state;
	// Ignore delayed search URL writes once React Router is leaving this page.
	const navigateSearch = (url: string) => {
		if (
			navigationState.current === 'idle' &&
			url !== `${window.location.pathname}${window.location.search}`
		) {
			void navigate(url, { preventScrollReset: true });
		}
	};

	const state$ = useObservable(() =>
		previousSearch?.key === location.key
			? previousSearch.state
			: createPageSearchState(discovery),
	);
	useEffect(
		() => () => {
			previousSearch = { key: location.key, state: state$.peek() };
		},
		[location.key, state$],
	);
	// Avoid clearing a persisted collection before Legend restores it.
	if (hasCollectionFilter && !collectionsReady) return null;

	return (
		<InstantSearchSSRProvider {...serverState}>
			<InstantSearch
				searchClient={searchClient}
				indexName={DEFAULT_SEARCH_INDEX}
				routing={routing(serverUrl, state$, discovery, navigateSearch)}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Configure
					attributesToRetrieve={attributesToRetrieve}
					hitsPerPage={hitsPerPage}
				/>
				{discovery && (
					<ContentHeader
						title={discovery.heading}
						description={discovery.intro}
					/>
				)}
				<Box className={classes.background}>
					<Box
						className={classes.container}
						pt={discovery ? 24 : undefined}
						ref={searchRef}
					>
						<Filters
							state$={state$}
							languages={languages}
							taxonomy={taxonomy}
						/>
					</Box>
				</Box>
				<Box className={classes.container}>
					<InfiniteHits
						state$={state$}
						previews={previews}
						languages={languages}
					/>
					<ScrollToTop containerId="#hits" targetRef={searchRef} />
				</Box>
			</InstantSearch>
		</InstantSearchSSRProvider>
	);
}

export default function Index() {
	return <CatalogSearchPage />;
}
