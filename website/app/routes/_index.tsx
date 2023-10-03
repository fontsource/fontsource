import { Box, MantineProvider } from '@mantine/core';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import algoliasearch from 'algoliasearch/lite';
// @ts-expect-error - no types but official recommended import
import { history } from 'instantsearch.js/cjs/lib/routers/index.js';
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
import { theme } from '@/styles/theme';

const searchClient = algoliasearch(
	'WNATE69PVR',
	'8b36fe56fca654afaeab5e6f822c14bd',
);

interface SearchProps {
	serverState?: InstantSearchServerState;
	serverUrl?: string;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
	const serverUrl = request.url;
	const serverState = await getServerState(
		<MantineProvider theme={theme}>
			<InstantSearch searchClient={searchClient} indexName="prod_POPULAR">
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
				routing={{
					router: history({
						getLocation() {
							if (typeof window === 'undefined') {
								return new URL(serverUrl!) as unknown as Location;
							}

							return window.location;
						},
					}),
				}}
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
