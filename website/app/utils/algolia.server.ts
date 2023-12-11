import TTLCache from '@isaacs/ttlcache';
import algoliasearch from 'algoliasearch';
import { type InstantSearchServerState } from 'react-instantsearch';

import {
	getFontlist,
	getFullMetadata,
	getStats,
} from '@/utils/metadata.server';
import type { AlgoliaMetadata } from '@/utils/types';

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

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const client = algoliasearch('WNATE69PVR', process.env.ALGOLIA_ADMIN_KEY!);

const shuffleArray = (size: number) => {
	// Generate array of numbers from 0 to size
	const arr: number[] = [...Array.from({ length: size }).keys()];

	// Durstenfeld shuffle to randomly sort array
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

const updateAlgoliaIndex = async (force?: boolean) => {
	try {
		// Get font list
		const list = Object.keys(await getFontlist());
		const indexArray: AlgoliaMetadata[] = [];

		// For the random shuffle, we need a presorted index
		// as Algolia does not support random sorting natively
		const randomIndexArr = shuffleArray(list.length);

		const metadataFull = await getFullMetadata();

		let index = 0;
		for (const id of list) {
			const metadata = metadataFull[id];
			if (!metadata)
				console.warn(`No metadata found for ${id} when updating Algolia index`);

			const stats = await getStats(id);
			const downloadCountMonthly = stats?.total?.npmDownloadMonthly;

			const obj = {
				objectID: id,
				family: metadata.family,
				subsets: metadata.subsets,
				weights: metadata.weights,
				styles: metadata.styles,
				category: metadata.category,
				defSubset: metadata.defSubset,
				variable: metadata.variable,
				// Algolia sorts date using a unix timestamp instead
				lastModified: Math.floor(
					new Date(metadata.lastModified).getTime() / 1000,
				),
				downloadMonth: downloadCountMonthly ?? 0,
				randomIndex: randomIndexArr[index],
			};

			indexArray.push(obj);
			index++;
		}

		const searchIndex = client.initIndex('prod_NAME');
		if (force) {
			await searchIndex.replaceAllObjects(indexArray);
			console.log('Replaced Algolia index');
		} else {
			await searchIndex.saveObjects(indexArray);
			console.log('Updated Algolia index');
		}
	} catch (error) {
		console.error(error);
	}
};

export { getSSRCache, setSSRCache, updateAlgoliaIndex };
