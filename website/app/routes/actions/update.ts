import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import invariant from 'tiny-invariant';

import { updateAlgoliaIndex } from '@/utils/algolia.server';
import { updateDownloadCount } from '@/utils/metadata/download.server';
import {
	metadataQueue,
	updateAllMetadata,
	updateSingleMetadata,
} from '@/utils/metadata/metadata.server';
import { updateAxisRegistry } from '@/utils/metadata/variable.server';

interface UpdateData {
	fonts?: boolean | string[];
	algolia?: boolean;
	download?: boolean;
	axisRegistry?: boolean;
	force?: boolean;
}

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

	if (data.fonts) {
		console.log('Updating fonts');
		if (Array.isArray(data.fonts)) {
			console.log(`Updating ${data.fonts.length} fonts`);
			for (const id of data.fonts) {
				metadataQueue.add(async () => await updateSingleMetadata(id));
			}
		} else {
			await updateAllMetadata();
			console.log('Updating all fonts');
		}
	}

	if (data.algolia) {
		console.log('Updating algolia index');
		await metadataQueue.onIdle(); // Wait for all metadata to be updated if fonts is called
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
