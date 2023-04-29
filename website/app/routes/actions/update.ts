import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import PQueue from 'p-queue';
import invariant from 'tiny-invariant';

import { updateAlgoliaIndex } from '@/utils/algolia.server';
import { updateDownloadCount } from '@/utils/metadata/download.server';
import { fetchMetadata, getFontList } from '@/utils/metadata/metadata.server';
import { updateAxisRegistry } from '@/utils/metadata/variable.server';
import type { MetadataType } from '@/utils/types';

interface UpdateData {
	fonts?: boolean | string[];
	algolia?: boolean;
	download?: boolean;
	axisRegistry?: boolean;
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

export const loader: LoaderFunction = async () => {
	return redirect('/');
};

export const action: ActionFunction = async ({ request }) => {
	const data: UpdateData = await request.json();
	const header = await request.headers.get('Authorization');
	invariant(header, 'No authorization header was sent with the request');

	invariant(data, 'No data was sent with the request');

	if (header !== `Bearer ${process.env.UPDATE_TOKEN}`) {
		return new Response('Invalid update bearer token', { status: 401 });
	}

	// Algolia already runs fetch metadata if that is active
	if (data.fonts && !data.algolia) {
		console.log('Updating fonts');
		await updateFonts(data);
	}

	if (data.algolia) {
		console.log('Updating algolia index');
		await updateAlgoliaIndex(data.force);
	}

	if (data.download) {
		console.log('Updating download count');
		await updateDownloadCount();
	}

	if (data.axisRegistry) {
		console.log('Updating axis registry');
		await updateAxisRegistry();
	}

	return new Response('Success!');
};
