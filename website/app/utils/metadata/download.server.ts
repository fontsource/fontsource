import { knex } from '@/utils/db.server';
import { ensurePrimary } from '@/utils/fly.server';
import { kya } from '@/utils/utils.server';

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
		'https://cdn.jsdelivr.net/gh/fontsource/download-stat-aggregator@main/data/lastMonthPopular.json'
	);
	const dataTotal: DownloadCount = await kya(
		'https://cdn.jsdelivr.net/gh/fontsource/download-stat-aggregator@main/data/totalPopular.json'
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

export { getDownloadCountList, updateDownloadCount };
