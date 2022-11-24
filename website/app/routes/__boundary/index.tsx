import { Box, createStyles, MantineProvider } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import algoliasearch from 'algoliasearch/lite';
import { Provider } from 'jotai';
import { renderToString } from 'react-dom/server';
import { getServerState } from 'react-instantsearch-hooks-server';
import {
	InstantSearch,
	InstantSearchSSRProvider,
} from 'react-instantsearch-hooks-web';

import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import { theme } from '@/styles/theme';

const searchClient = algoliasearch(
	'WNATE69PVR',
	'8b36fe56fca654afaeab5e6f822c14bd'
);

const useStyles = createStyles((theme) => ({
	background: {
		backgroundColor:
			theme.colorScheme === 'dark'
				? theme.colors.background[5]
				: theme.colors.background[1],
	},

	container: {
		maxWidth: '1440px',
		marginLeft: 'auto',
		marginRight: 'auto',
		padding: '40px 64px',

		[theme.fn.smallerThan('lg')]: {
			padding: '40px 40px',
		},

		[theme.fn.smallerThan('xs')]: {
			padding: '40px 24px',
		},
	},
}));

export const loader: LoaderFunction = async ({ request }) => {
	const serverUrl = request.url;

	const serverState = await getServerState(
		<MantineProvider theme={theme}>
			<InstantSearch searchClient={searchClient} indexName="prod_POPULAR">
				<Filters />
				<InfiniteHits />
			</InstantSearch>
		</MantineProvider>,
		{ renderToString }
	);

	return json({
		serverState,
		serverUrl,
	});
};

export default function Index() {
	const { serverState } = useLoaderData();
	const { classes } = useStyles();

	return (
		<Provider>
			<InstantSearchSSRProvider {...serverState}>
				<InstantSearch searchClient={searchClient} indexName="prod_POPULAR">
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
		</Provider>
	);
}
