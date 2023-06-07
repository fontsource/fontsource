import PQueue from 'p-queue';

import { addCss } from '@/utils/css.server';
import { knex } from '@/utils/db.server';
import { ensurePrimary } from '@/utils/fly.server';
import type { DownloadMetadata, FontList, Metadata } from '@/utils/types';
import { kya } from '@/utils/utils.server';

const getFontList = async (): Promise<FontList> => {
	return await kya(
		'https://raw.githubusercontent.com/fontsource/font-files/main/FONTLIST.json'
	);
};

const updateMetadata = async (metadata: DownloadMetadata) => {
	await ensurePrimary();
	console.log(`Updating metadata for ${metadata.id}`);

	// Save metadata to DB
	await knex('fonts')
		.insert({
			id: metadata.id,
			family: metadata.family,
			subsets: metadata.subsets.join(','),
			weights: metadata.weights.join(','),
			styles: metadata.styles.join(','),
			defSubset: metadata.defSubset,
			variable: Boolean(metadata.variable),
			lastModified: metadata.lastModified,
			version: metadata.version,
			npmVersion: metadata.npmVersion,
			category: metadata.category,
			source: metadata.source,
			license: JSON.stringify(metadata.license),
			type: metadata.type,
		})
		.onConflict('id')
		.merge();

	await knex('unicode')
		.insert({
			id: metadata.id,
			data: JSON.stringify(metadata.unicodeRange),
		})
		.onConflict('id')
		.merge();

	if (metadata.variable) {
		await knex('variable')
			.insert({
				id: metadata.id,
				axes: JSON.stringify(metadata.variable),
			})
			.onConflict('id')
			.merge();
	}

	await addCss(metadata);
	console.log(`Fetched metadata for ${metadata.id}`);
};

const getMetadata = async (id: string): Promise<Metadata> => {
	// Check if metadata already exists in DB
	let metadata = await knex('fonts').where({ id }).first();
	if (!metadata) {
		await updateSingleMetadata('id');
		metadata = await knex('fonts').where({ id }).first();
	}

	// Convert metadata from DB to JSON friendly
	metadata.subsets = metadata.subsets.split(',');
	metadata.weights = metadata.weights.split(',').map(Number);
	metadata.styles = metadata.styles.split(',');
	metadata.variable = Boolean(metadata.variable);
	metadata.license = JSON.parse(metadata.license);

	return metadata;
};

const MANIFEST_URL =
	'https://raw.githubusercontent.com/fontsource/font-files/main/metadata/fontsource.json';

const getMetadataDate = async (id: string) => {
	const date = await knex('fonts').select('lastModified').where({ id }).first();
	return date?.lastModified;
};

// We can cache these results
let manifestCache: Record<string, DownloadMetadata> = {};
let fontlistCache: FontList = {};

const updateMetadataCaches = async () => {
	fontlistCache = await getFontList();
	manifestCache = await kya(MANIFEST_URL);
};

export const metadataQueue = new PQueue({ concurrency: 4 });
// @ts-expect-error - for some reason error is not an accepted type
metadataQueue.on('error', async (error) => {
	console.error(error);
});

metadataQueue.on('idle', async () => {
	console.log('Metadata update complete!');
});

const updateSingleMetadata = async (id: string) => {
	let metadata = manifestCache[id];
	if (!metadata) {
		await updateMetadataCaches();
		metadata = manifestCache[id];
		if (!metadata) {
			throw new Error(`Font ${id} does not exist in manifest`);
		}
	}

	await updateMetadata(metadata);
};

const updateAllMetadata = async () => {
	await updateMetadataCaches();

	const updateArr = [];
	// If no fonts are specified, check all fonts
	for (const id of Object.keys(fontlistCache)) {
		if ((await getMetadataDate(id)) !== fontlistCache[id]) {
			updateArr.push(id);
		}
	}

	// Verify that fonts exist in manifest
	for (const id of updateArr) {
		if (!manifestCache[id]) {
			throw new Error(`Font ${id} does not exist in manifest`);
		}
	}

	for (const id of updateArr) {
		// eslint-disable-next-line no-loop-func
		metadataQueue.add(async () => {
			await updateMetadata(manifestCache[id]);
		});
	}
};

export {
	getFontList,
	getMetadata,
	updateAllMetadata,
	updateMetadata,
	updateSingleMetadata,
};
