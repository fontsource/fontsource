import type { ActionFunction } from '@remix-run/node';
import PQueue from 'p-queue';
import invariant from 'tiny-invariant';

import { updateAlgoliaIndex } from '@/utils/algolia.server';
import {
	fetchMetadata,
	getFontList,
	updateDownloadCount,
} from '@/utils/metadata.server';
import type { MetadataType } from '@/utils/types';

import deployMigrations from '../../../scripts/migrations.js';

interface UpdateData {
	token: string;
	fonts?: boolean | string[];
	algolia?: boolean;
	download?: boolean;
	migrations?: boolean;
	force?: boolean;
}

// Speed things up by running these in parallel
const queue = new PQueue({ concurrency: 32 });

// @ts-ignore - for some reason error is not an accepted type
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
		queue.add(async () => await fetchMetadata(id, list[id] as MetadataType));
	}
};

export const action: ActionFunction = async ({ request }) => {
	const data: UpdateData = await request.json();
	invariant(data, 'No data was sent with the request');
	invariant(data.token, 'No update token was sent with the request');

	if (data.token !== process.env.UPDATE_TOKEN) {
		return new Response('Invalid update token', { status: 401 });
	}

	// Algolia already runs fetch metadata if that is active
	if (data.fonts && !data.algolia) {
		await updateFonts(data);
	}

	if (data.algolia) {
		await updateAlgoliaIndex(data.force);
	}

	if (data.download) {
		await updateDownloadCount();
	}

	if (data.migrations) {
		await deployMigrations();
	}

	return new Response('Success!');
};
