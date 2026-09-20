import { useObservable, useValue } from '@legendapp/state/react';
import { Box } from '@mantine/core';
import { useRef } from 'react';
import {
	Configure,
	InstantSearch,
	InstantSearchSSRProvider,
} from 'react-instantsearch';
import {
	type HeadersFunction,
	type LinksFunction,
	type MetaFunction,
	useLoaderData,
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
import { cacheHeaders } from '@/utils/cache';
import { ogMeta } from '@/utils/meta';
import {
	ALGOLIA_APP_ID,
	attributesToRetrieve,
	createPageSearchState,
	routing,
	type SearchProps,
	searchClient,
} from '@/utils/search-config';

export { loader } from '@/utils/search.server';

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

export const headers: HeadersFunction = ({ parentHeaders, errorHeaders }) => {
	if (errorHeaders) return errorHeaders;
	for (const [name, value] of Object.entries(cacheHeaders.registry)) {
		parentHeaders.set(name, value);
	}
	for (const link of HOME_DISCOVERY_LINKS) {
		parentHeaders.append('Link', link);
	}

	return parentHeaders;
};

export function CatalogSearchPage() {
	const { discovery, hasCollectionFilter, serverState, serverUrl, previews } =
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
	// Avoid clearing a persisted collection before Legend restores it.
	if (hasCollectionFilter && !collectionsReady) return null;

	return (
		<InstantSearchSSRProvider {...serverState}>
			<InstantSearch
				searchClient={searchClient}
				indexName="prod_POPULAR"
				routing={routing(
					serverUrl,
					state$,
					discovery,
					discovery ? navigateSearch : undefined,
				)}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Configure attributesToRetrieve={attributesToRetrieve} />
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
						<Filters state$={state$} />
					</Box>
				</Box>
				<Box className={classes.container}>
					<InfiniteHits state$={state$} previews={previews} />
					<ScrollToTop containerId="#hits" targetRef={searchRef} />
				</Box>
			</InstantSearch>
		</InstantSearchSSRProvider>
	);
}

export default function Index() {
	return <CatalogSearchPage />;
}
