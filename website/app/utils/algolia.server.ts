import algoliasearch from 'algoliasearch';

import {
	getDownloadCountMonth,
	updateDownloadCount,
} from '@/utils/metadata/download.server';
import { getFontlist, getFullMetadata } from '@/utils/metadata/metadata.server';
import type { AlgoliaMetadata } from '@/utils/types';

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

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const client = algoliasearch('WNATE69PVR', process.env.ALGOLIA_ADMIN_KEY!);

const updateAlgoliaIndex = async (force?: boolean) => {
	try {
		// Get font list
		const list = Object.keys(await getFontlist());
		const indexArray: AlgoliaMetadata[] = [];

		// For the random shuffle, we need a presorted index
		// as Algolia does not support random sorting natively
		const randomIndexArr = shuffleArray(list.length);

		// Since getting a new download count isn't expensive,
		// we can just update it everytime we update the index
		await updateDownloadCount();

		const metadataFull = await getFullMetadata();

		let index = 0;
		for (const id of list) {
			const metadata = metadataFull[id];
			if (!metadata)
				console.warn(`No metadata found for ${id} when updating Algolia index`);

			const downloadCountMonthly = await getDownloadCountMonth(id);

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
					new Date(metadata.lastModified).getTime() / 1000
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

export { updateAlgoliaIndex };
