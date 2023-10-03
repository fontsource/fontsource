import { Box } from '@mantine/core';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch } from 'react-instantsearch';

import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';
import classes from '@/styles/global.module.css';

const searchClient = algoliasearch(
	'WNATE69PVR',
	'8b36fe56fca654afaeab5e6f822c14bd',
);

/* interface SearchProps {
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
}; */

export default function Index() {
	// const { serverState, serverUrl } = useLoaderData<typeof loader>();

	return (
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
	);
}
