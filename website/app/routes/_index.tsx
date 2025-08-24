import { observable } from '@legendapp/state';
import { useObservable } from '@legendapp/state/react';
import { Box, MantineProvider } from '@mantine/core';
// TODO: Use lite client - https://github.com/algolia/algoliasearch-client-javascript/issues/1548#issuecomment-2380488738
import { algoliasearch } from 'algoliasearch';
import type { UiState } from 'instantsearch.js';
// @ts-expect-error - No type definitions available
import { history } from 'instantsearch.js/cjs/lib/routers/index.js';
import type { BrowserHistoryArgs } from 'instantsearch.js/es/lib/routers/history';
import type { RouterProps } from 'instantsearch.js/es/middlewares';
import { useRef } from 'react';
import { renderToString } from 'react-dom/server';
import {
	getServerState,
	InstantSearch,
	type InstantSearchServerState,
	InstantSearchSSRProvider,
} from 'react-instantsearch';
import { data, type LoaderFunctionArgs, useLoaderData } from 'react-router';

import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import type { SearchObject } from '@/components/search/observables';
import { ScrollToTop } from '@/components/search/ScrollToTop';

import classes from '@/styles/global.module.css';
import { theme } from '@/styles/theme';

interface SearchProps {
	serverState?: InstantSearchServerState;
	serverUrl: string;
}

const ALGOLIA_TTL = 6 * 60 * 60 * 1000; // 6 hours

const searchClient = algoliasearch(
	'WNATE69PVR',
	'8b36fe56fca654afaeab5e6f822c14bd',
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

const routing = (serverUrl: string): RouterProps<UiState, UiState> => {
	const indexName = 'prod_POPULAR';
	return {
		router: history({
			getLocation: () => {
				return typeof window === 'undefined'
					? (new URL(serverUrl) as unknown as Location)
					: window.location;
			},
			cleanUrlOnDispose: true,
		} satisfies Partial<BrowserHistoryArgs<UiState>>),
		stateMapping: {
			// @ts-expect-error - This is a valid function signature
			stateToRoute(uiState) {
				const index = uiState[indexName];
				const result = {
					query: index.query,
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
			// @ts-expect-error - This is a valid function signature
			routeToState(routeState) {
				const state = {
					query: routeState.query,
					// RefinementList facets
					...(routeState.subsets
						? // @ts-expect-error - This is a valid object
							{ refinementList: { subsets: routeState.subsets.split(',') } }
						: {}),
					// Menu facets
					...(routeState.category
						? { menu: { category: routeState.category } }
						: {}),
					// Variable toggle
					...(routeState.variable ? { toggle: { variable: true } } : {}),
					// Sortby map
					...(routeState.sort
						? {
								sortBy: sortMap[String(routeState.sort)],
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

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
	const { ALGOLIA } = context.cloudflare.env;
	const serverUrl = request.url;

	// Generate default state object for ssr
	const state$ = observable<SearchObject>({
		size: 32,
		preview: {
			label: 'Sentence',
			value: 'Sphinx of black quartz, judge my vow.',
			inputView: '',
		},
		language: 'latin',
		display: 'grid',
	});

	// Check local cache for server state first to avoid unnecessary API calls
	let serverState = await ALGOLIA.get(serverUrl, 'json');
	if (serverState) {
		return data<SearchProps>({
			serverState,
			serverUrl,
		});
	}

	serverState = await getServerState(
		<MantineProvider theme={theme}>
			<InstantSearchSSRProvider>
				<InstantSearch
					searchClient={searchClient}
					indexName="prod_POPULAR"
					routing={routing(serverUrl)}
					future={{ preserveSharedStateOnUnmount: true }}
				>
					<Filters state$={state$} />
					<InfiniteHits state$={state$} />
				</InstantSearch>
			</InstantSearchSSRProvider>
		</MantineProvider>,
		{
			renderToString,
		},
	);

	// Add server state to local cache before responding
	context.cloudflare.ctx.waitUntil(
		ALGOLIA.put(serverUrl, JSON.stringify(serverState), {
			expirationTtl: ALGOLIA_TTL,
		}),
	);

	return data<SearchProps>(
		{
			serverState,
			serverUrl,
		},
		{
			headers: {
				'Cache-Control': 'public, max-age=300',
			},
		},
	);
};

export default function Index() {
	const { serverState, serverUrl } = useLoaderData<typeof loader>();
	const searchRef = useRef(null);

	const state$ = useObservable<SearchObject>({
		size: 32,
		preview: {
			label: 'Sentence',
			value: 'Sphinx of black quartz, judge my vow.',
			inputView: '',
		},
		language: 'latin',
		display: 'grid',
	});

	// Update the preset preview label to custom if
	// a manual input is detected
	state$.preview.inputView.onChange((e) => {
		if (e.value !== '') {
			state$.preview.label.set('Custom');
			state$.preview.value.set(e.value ?? '');
		}
	});

	return (
		<InstantSearchSSRProvider {...serverState}>
			<InstantSearch
				searchClient={searchClient}
				indexName="prod_POPULAR"
				routing={routing(serverUrl)}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Box className={classes.background}>
					<Box className={classes.container} ref={searchRef}>
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
