import { createFetchRequester } from '@algolia/requester-fetch';
import {
	liteClient as algoliasearch,
	type LiteClient,
} from 'algoliasearch/lite';

export const ALGOLIA_APP_ID = 'WNATE69PVR';
export const DEFAULT_SEARCH_INDEX = 'prod_POPULAR';

const createSearchClient = (): LiteClient =>
	algoliasearch(ALGOLIA_APP_ID, '8b36fe56fca654afaeab5e6f822c14bd', {
		requester: createFetchRequester(),
	});

export const searchClient: LiteClient = createSearchClient();

// InstantSearch hydration modifies its client; keep direct API calls isolated.
export const instantSearchClient: LiteClient = createSearchClient();
