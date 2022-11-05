import { Box, createStyles } from '@mantine/core';
import algoliasearch from 'algoliasearch/lite';
import { Provider } from 'jotai';
import { InstantSearch } from 'react-instantsearch-hooks-web';

import { Filters } from '~/components/search/Filters';
import { InfiniteHits } from '~/components/search/Hits';

const searchClient = algoliasearch(
  'WNATE69PVR',
  '8b36fe56fca654afaeab5e6f822c14bd',
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
  },
}));

export default function Index() {
  const { classes } = useStyles();

  return (
    <Provider>
      <InstantSearch searchClient={searchClient} indexName="prod_FONTS">
        <Box className={classes.background}>
          <Box className={classes.container}>
            <Filters />
          </Box>
        </Box>
        <Box className={classes.container}>
          <InfiniteHits />
        </Box>
      </InstantSearch>
    </Provider>
  );
}
