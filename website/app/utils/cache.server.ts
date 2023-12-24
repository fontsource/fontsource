import { LRUCache } from 'lru-cache';

const cssCache = new LRUCache<string, string>({
	max: 1000,
	ttl: 1000 * 60 * 60 * 24, // 1 day
});

const getCSSCache = (key: string) => {
	return cssCache.get(key);
};

const setCSSCache = (key: string, value: string) => {
	cssCache.set(key, value);
};

export { getCSSCache, setCSSCache };
