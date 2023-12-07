import { Box } from '@mantine/core';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import algoliasearch from 'algoliasearch/lite';
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

const routing = (serverUrl: string) => {
	return {
		router: history({
			getLocation: () => {
				return typeof window === 'undefined'
					? new URL(serverUrl)
					: window.location;
			},
		}),
	};
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const serverUrl = request.url;
	const serverState = await getServerState(
		<InstantSearch
			searchClient={searchClient}
			indexName="prod_POPULAR"
			routing={routing(serverUrl)}
			future={{ preserveSharedStateOnUnmount: true }}
		></InstantSearch>,
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
