import ky from 'ky';

import { addCss } from './css.server';
import { knex } from './db.server';
import { ensurePrimary } from './fly.server';
import type {
	DownloadMetadata,
	FontList,
	PackageJson,
	UnicodeData,
} from './types';

const getFontList = async (): Promise<FontList> => {
	return ky(
		'https://raw.githubusercontent.com/fontsource/fontsource/main/FONTLIST.json'
	).json();
};

const fetchMetadata = async (id: string) => {
	// We can only write to DB in primary instance
	await ensurePrimary();

	const BASE_URL = 'https://cdn.jsdelivr.net/npm';
	const METADATA_URL = `${BASE_URL}/@fontsource/${id}/metadata.json`;
	const UNICODE_URL = `${BASE_URL}/@fontsource/${id}/unicode.json`;
	const PACKAGE_URL = `${BASE_URL}/@fontsource/${id}/package.json`;

	const metadata: DownloadMetadata = await ky(METADATA_URL).json();
	const unicode: UnicodeData = await ky(UNICODE_URL).json();
	const packageJson: PackageJson = await ky(PACKAGE_URL).json();

	// Save metadata to DB
	await knex('fonts')
		.insert({
			id: metadata.fontId,
			family: metadata.fontName,
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
			license: metadata.license,
			type: metadata.type,
		})
		.onConflict('id')
		.merge();

	await knex('unicode')
		.insert({
			id: metadata.fontId,
			data: JSON.stringify(unicode),
		})
		.onConflict('id')
		.merge();

	if (metadata.variable) {
		await knex('variable')
			.insert({
				id: metadata.fontId,
				axes: JSON.stringify(metadata.variable),
			})
			.onConflict('id')
			.merge();
	}

	await addCss(metadata);
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

	return metadata;
};

export { fetchMetadata, getFontList, getMetadata };
