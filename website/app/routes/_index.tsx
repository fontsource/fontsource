import { Box, MantineProvider } from '@mantine/core';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import algoliasearch from 'algoliasearch/lite';
import { type UiState } from 'instantsearch.js';
import { type BrowserHistoryArgs } from 'instantsearch.js/es/lib/routers/history';
import { type RouterProps } from 'instantsearch.js/es/middlewares';
import { renderToString } from 'react-dom/server';
import {
	getServerState,
	InstantSearch,
	type InstantSearchServerState,
	InstantSearchSSRProvider,
} from 'react-instantsearch';

import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import classes from '@/styles/global.module.css';

import { theme } from '../styles/theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires, unicorn/prefer-module
const { history } = require('instantsearch.js/cjs/lib/routers/index.js');

const searchClient = algoliasearch(
	'WNATE69PVR',
	'8b36fe56fca654afaeab5e6f822c14bd',
);

interface SearchProps {
	serverState?: InstantSearchServerState;
	serverUrl: string;
}

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

const routing = (serverUrl: string): any => {
	const indexName = 'prod_POPULAR';
	return {
		router: history({
			getLocation: () => {
				return typeof window === 'undefined'
					? (new URL(serverUrl) as unknown as Location)
					: window.location;
			},
		} satisfies Partial<BrowserHistoryArgs<UiState>>),
		stateMapping: {
			stateToRoute(uiState: UiState) {
				console.log('STATE');
				console.log(uiState);
				const index = uiState[indexName];
				const result = {
					query: index.query,
					...(index.sortBy ? { sort: sortMap[index.sortBy] } : {}),
				};
				console.log(result);
				return result;
			},
			routeToState(routeState: UiState) {
				console.log('ROUTE');
				console.log(routeState);
				const state = {
					query: routeState.query,
					...(routeState.sort
						? {
								sortBy: sortMap[String(routeState.sort)],
						  }
						: {}),
				};
				const result = {
					[indexName]: state,
				};
				console.log(result);
				return result;
			},
		},
	};
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const serverUrl = request.url;
	const serverState = await getServerState(
		<MantineProvider theme={theme}>
			<InstantSearch
				searchClient={searchClient}
				indexName="prod_POPULAR"
				routing={routing(serverUrl)}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Filters />
				<InfiniteHits />
			</InstantSearch>
		</MantineProvider>,
		{
			renderToString,
		},
	);

	return json<SearchProps>({
		serverState,
		serverUrl,
	});
};

export default function Index() {
	const { serverState, serverUrl } = useLoaderData<typeof loader>();
	return (
		<InstantSearchSSRProvider {...serverState}>
			<InstantSearch
				searchClient={searchClient}
				indexName="prod_POPULAR"
				routing={routing(serverUrl)}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Box className={classes.background}>
					<Box className={classes.container}>
						<Filters />
					</Box>
				</Box>
				<Box className={classes.container}>
					<InfiniteHits />
				</Box>
			</InstantSearch>
		</InstantSearchSSRProvider>
	);
}
