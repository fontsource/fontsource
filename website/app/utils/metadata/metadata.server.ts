import { addCss } from '@/utils/css.server';
import { knex } from '@/utils/db.server';
import { ensurePrimary } from '@/utils/fly.server';
import type { DownloadMetadata, FontList } from '@/utils/types';
import { kya } from '@/utils/utils.server';

const getFontList = async (): Promise<FontList> => {
	return kya(
		'https://raw.githubusercontent.com/fontsource/font-files/main/FONTLIST.json'
	);
};

const updateMetadata = async (metadata: DownloadMetadata) => {
	await ensurePrimary();

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

const getMetadata = async (id: string) => {
	// Check if metadata already exists in DB
	let metadata = await knex('fonts').where({ id }).first();
	if (!metadata) {
		await updateAllMetadata([id]);
		metadata = await knex('fonts').where({ id }).first();
	}

	// Convert metadata from DB to JSON friendly
	metadata.subsets = metadata.subsets.split(',');
	metadata.weights = metadata.weights.split(',').map((w: string) => Number(w));
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

const updateAllMetadata = async (fonts?: string[]) => {
	const fontList = await getFontList();

	const updateArr = fonts ?? [];
	// If no fonts are specified, check all fonts
	if (!fonts) {
		for (const id of Object.keys(fontList)) {
			if ((await getMetadataDate(id)) !== fontList[id]) {
				updateArr.push(id);
			}
		}
	}

	// Verify that fonts exist in manifest
	for (const id of updateArr) {
		if (!fontList[id]) {
			throw new Error(`Font ${id} does not exist in manifest`);
		}
	}

	const manifest: Record<string, DownloadMetadata> = await kya(MANIFEST_URL);
	for (const id of updateArr) {
		console.log(`Updating metadata for ${id}`);
		await updateMetadata(manifest[id]);
	}

	console.log(`Updated metadata for ${updateArr.length} fonts`);
};

export { getFontList, getMetadata, updateAllMetadata, updateMetadata };
