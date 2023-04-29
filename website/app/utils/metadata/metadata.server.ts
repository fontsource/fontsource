import { addCss } from '@/utils/css.server';
import { knex } from '@/utils/db.server';
import { ensurePrimary } from '@/utils/fly.server';
import type {
	DownloadMetadata,
	FontList,
	MetadataType,
	PackageJson,
	UnicodeData,
} from '@/utils/types';
import { isMetadataType } from '@/utils/types';
import { kya } from '@/utils/utils.server';

const getFontList = async (): Promise<FontList> => {
	return kya(
		'https://raw.githubusercontent.com/fontsource/font-files/main/FONTLIST.json'
	);
};

const BASE_URL = (type: MetadataType) =>
	`https://cdn.jsdelivr.net/gh/fontsource/font-files@main/fonts/${type}`;

const fetchMetadata = async (id: string, type?: MetadataType) => {
	await ensurePrimary();

	if (!type) {
		const fontList = await getFontList();
		type = fontList[id] as MetadataType;
		if (!isMetadataType(type))
			throw new Error(
				`Font ID ${id} does not have a valid metadata type (${type}).`
			);
	}

	const METADATA_URL = `${BASE_URL(type)}/${id}/metadata.json`;
	const UNICODE_URL = `${BASE_URL(type)}/${id}/unicode.json`;
	const PACKAGE_URL = `${BASE_URL(type)}/${id}/package.json`;

	const metadata: DownloadMetadata = await kya(METADATA_URL);
	const unicode: UnicodeData = await kya(UNICODE_URL);
	const packageJson: PackageJson = await kya(PACKAGE_URL);

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
			npmVersion: packageJson.version,
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
			data: JSON.stringify(unicode),
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
	console.log(`Fetched metadata for ${id}`);
};

const getMetadata = async (id: string) => {
	// Check if metadata already exists in DB
	let metadata = await knex('fonts').where({ id }).first();
	if (!metadata) {
		await fetchMetadata(id);
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

export { fetchMetadata, getFontList, getMetadata };
