import { Box, createStyles } from '@mantine/core';
import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import algoliasearch from 'algoliasearch/lite';
// @ts-ignore
import { history } from 'instantsearch.js/cjs/lib/routers/index.js';
import { Provider } from 'jotai';
import { renderToString } from 'react-dom/server';
import { getServerState } from 'react-instantsearch-hooks-server';
import {
  InstantSearch,
  InstantSearchSSRProvider,
} from 'react-instantsearch-hooks-web';

import { Filters } from '@/components/search/Filters';
import { InfiniteHits } from '@/components/search/Hits';

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
      <InstantSearch
        searchClient={searchClient}
        indexName="prod_FONTS"
        routing={{
          router: history({
            getLocation() {
              if (typeof window === 'undefined') {
                return new URL(serverUrl);
              }

              return window.location;
            },
          }),
        }}
      />,
    { renderToString }
  );

  return json({
    serverState,
    serverUrl,
  });
};

export default function Index() {
  const { serverState, serverUrl } = useLoaderData();
  const { classes } = useStyles();

  return (
    <Provider>
      <InstantSearchSSRProvider {...serverState}>
        <InstantSearch
          searchClient={searchClient}
          indexName="prod_FONTS"
          routing={{
            router: history({
              getLocation() {
                if (typeof window === 'undefined') {
                  return new URL(serverUrl);
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
    </Provider>
  );
}
