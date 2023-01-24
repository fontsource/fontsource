import { addCss } from './css.server';
import { knex } from './db.server';
import { ensurePrimary } from './fly.server';
import type {
	DownloadMetadata,
	FontList,
	PackageJson,
	UnicodeData,
} from './types';
import { kya } from './utils.server';

const getFontList = async (): Promise<FontList> => {
	return kya(
		'https://raw.githubusercontent.com/fontsource/fontsource/main/FONTLIST.json'
	);
};

const fetchMetadata = async (id: string) => {
	// We can only write to DB in primary instance
	await ensurePrimary();

	const BASE_URL = 'https://cdn.jsdelivr.net/npm';
	const METADATA_URL = `${BASE_URL}/@fontsource/${id}/metadata.json`;
	const UNICODE_URL = `${BASE_URL}/@fontsource/${id}/unicode.json`;
	const PACKAGE_URL = `${BASE_URL}/@fontsource/${id}/package.json`;

	const metadata: DownloadMetadata = await kya(METADATA_URL);
	const unicode: UnicodeData = await kya(UNICODE_URL);
	const packageJson: PackageJson = await kya(PACKAGE_URL);

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

	return metadata;
};

const getVariable = async (id: string) => {
	const variable = await knex('variable').where({ id }).first();
	if (!variable) return null;
	return JSON.parse(variable.axes);
};

interface DownloadCount {
	[name: string]: number;
}

const cleanCounts = (counts: DownloadCount) => {
	for (const key of Object.keys(counts)) {
		if (key.startsWith('fontsource-')) delete counts[key];
	}

	for (const key of Object.keys(counts)) {
		counts[key.replace('@fontsource/', '')] = counts[key];
		delete counts[key];
	}
	return counts;
};

const getDownloadCountList = async () => {
	const dataMonth: DownloadCount = await kya(
		'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/lastMonthPopular.json'
	);
	const dataTotal: DownloadCount = await kya(
		'https://raw.githubusercontent.com/fontsource/download-stat-aggregator/main/data/totalPopular.json'
	);

	return { month: cleanCounts(dataMonth), total: cleanCounts(dataTotal) };
};

const updateDownloadCount = async () => {
	await ensurePrimary();

	const { month, total } = await getDownloadCountList();
	const insertData = [];
	for (const id of Object.keys(month)) {
		insertData.push({ id, month: month[id], total: total[id] });
	}

	// Refer for chunk behaviour - https://github.com/knex/knex/issues/5231
	const chunkSize = 499;
	for (let i = 0; i < insertData.length; i += chunkSize) {
		const chunk = insertData.slice(i, i + chunkSize);
		await knex('downloads').insert(chunk).onConflict('id').merge();
	}
};

export {
	fetchMetadata,
	getDownloadCountList,
	getFontList,
	getMetadata,
	getVariable,
	updateDownloadCount,
};
