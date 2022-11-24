import type { ActionFunction } from '@remix-run/node';
import PQueue from 'p-queue';
import invariant from 'tiny-invariant';

import { updateAlgoliaIndex } from '@/utils/algolia.server';
import { ensurePrimary } from '@/utils/fly.server';
import {
	fetchMetadata,
	getFontList,
	updateDownloadCount,
} from '@/utils/metadata.server';

interface UpdateData {
	token: string;
	fonts?: boolean | string[];
	algolia?: boolean;
	download?: boolean;
}

// Speed things up by running these in parallel
const queue = new PQueue({ concurrency: 32 });

queue.on('error', (error) => {
	console.error(error);
});

queue.on('idle', async () => {
	console.log('Metadata update complete!');
});

const updateFonts = async (data: UpdateData) => {
	const list = await getFontList();

	let updateList: string[] = [];
	if (Array.isArray(data.fonts)) {
		// Verify that the fonts sent are valid
		for (const id of data.fonts) {
			invariant(Object.keys(list).includes(id), `Font ${id} does not exist`);
		}

		updateList = data.fonts;
	} else {
		updateList = Object.keys(list);
	}

	for (const id of updateList) {
		queue.add(async () => await fetchMetadata(id));
	}
};

export const action: ActionFunction = async ({ request }) => {
	await ensurePrimary();

	const data: UpdateData = await request.json();
	invariant(data, 'No data was sent with the request');
	invariant(data.token, 'No update token was sent with the request');

	if (data.token !== process.env.UPDATE_TOKEN) {
		return new Response('Invalid update token', { status: 401 });
	}

	if (data.fonts) {
		await updateFonts(data);
	}

	if (data.algolia) {
		await updateAlgoliaIndex();
	}

	if (data.download) {
		await updateDownloadCount();
	}

	return new Response('Success!');
};
