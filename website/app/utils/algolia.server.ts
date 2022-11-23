import algoliasearch from 'algoliasearch';

import { knex } from './db.server';
import { ensurePrimary } from './fly.server';
import {
	fetchMetadata,
	getFontList,
	updateDownloadCount,
} from './metadata.server';

interface AlgoliaMetadata {
	objectID: string;
	family: string;
	subsets: string[];
	weights: number[];
	styles: string[];
	category: string;
	variable: boolean;
	lastModified: number;
	downloadMonth: number;
	randomIndex: number;
}

const shuffleArray = (size: number) => {
	// Generate array of numbers from 0 to size
	const arr: number[] = [...Array(size).keys()];

	// Durstenfeld shuffle to randomly sort array
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

const client = algoliasearch('WNATE69PVR', process.env.ALGOLIA_ADMIN_KEY!);

const getMetadata = async (id: string) =>
	await knex
		.select(
			'family',
			'subsets',
			'weights',
			'styles',
			'category',
			'variable',
			'lastModified'
		)
		.from('fonts')
		.where({ id })
		.first();

const downloadCount = async (id: string) =>
	await knex.select('month').from('downloads').where({ id }).first();

const updateAlgoliaIndex = async () => {
	try {
		await ensurePrimary();

		// Get font list
		const list = Object.keys(await getFontList());
		const indexArray: AlgoliaMetadata[] = [];

		// For the random shuffle, we need a presorted index
		// as Algolia does not support random sorting natively
		const randomIndexArr = shuffleArray(list.length);

		// Since getting a new download count isn't expensive,
		// we can just update it everytime we update the index
		await updateDownloadCount();

		let index = 0;
		for (const id of list) {
			let metadata = await getMetadata(id);

			if (!metadata) {
				await fetchMetadata(id);
				metadata = await getMetadata(id);
			}

			const downloadCountMonthly = await downloadCount(id);

			const obj = {
				objectID: id,
				family: metadata.family,
				subsets: metadata.subsets.split(','),
				weights: metadata.weights.split(',').map((w: string) => Number(w)),
				styles: metadata.styles.split(','),
				category: metadata.category,
				variable: Boolean(metadata.variable),
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
		await searchIndex.saveObjects(indexArray);
		console.log('Updated Algolia index');
	} catch (err) {
		console.error(err);
	}
};

export { updateAlgoliaIndex };
