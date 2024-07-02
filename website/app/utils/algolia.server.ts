import TTLCache from '@isaacs/ttlcache';
import type { InstantSearchServerState } from 'react-instantsearch';

// Cache for Algolia SSR state to avoid re-fetching on every request
const ALGOLIA_TTL = 6 * 60 * 60 * 1000; // 6 hours
const ssrCache = new TTLCache({ ttl: ALGOLIA_TTL });

const getSSRCache = (
	serverUrl: string,
): InstantSearchServerState | undefined => {
	return ssrCache.get(serverUrl);
};

const setSSRCache = (serverUrl: string, state: InstantSearchServerState) => {
	ssrCache.set(serverUrl, state);
};

export { getSSRCache, setSSRCache };
