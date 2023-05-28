import JSZip from 'jszip';
import { IDResponse } from './types';
import { StatusError } from 'itty-router';
import PQueue from 'p-queue';

interface URLMetadata {
	id: string;
	subset: string;
	weight: number;
	style: string;
	extension: string;
}

const getFileUrl = (
	{ id, subset, weight, style, extension }: URLMetadata,
	npmVersion: string
) =>
	`https://cdn.jsdelivr.net/npm/@fontsource/${id}@${npmVersion}/files/${id}-${subset}-${weight}-${style}.${extension}`;

const updateBucket = async (
	{ id, weights, styles, subsets }: IDResponse,
	env: Env
) => {
	try {
		// Generate zip file of all fonts
		const zip = new JSZip();
		const webfonts = zip.folder('webfonts');

		// Create a queue
		const queue = new PQueue({ concurrency: 16 });

		const downloadFile = async ({
			id,
			subset,
			weight,
			style,
			extension,
		}: URLMetadata) => {
			const url = getFileUrl(
				{ id, subset, weight, style, extension },
				'latest'
			);
			const buffer = await fetch(url).then((res) => res.arrayBuffer());

			// Add to zip file
			if (!webfonts) throw new Error('could not generate webfonts folder');
			webfonts.file(`${id}-${subset}-${weight}-${style}.${extension}`, buffer);

			// Add to bucket
			await env.BUCKET.put(
				`${id}@latest/${subset}-${weight}-${style}.${extension}`,
				buffer
			);
		};

		// Add all individual font files to the bucket
		for (const weight of weights) {
			for (const style of styles) {
				for (const subset of subsets) {
					for (const extension of ['woff2', 'woff']) {
						// For now we only push to latest tag
						const urlMetadata: URLMetadata = {
							id,
							subset,
							weight,
							style,
							extension,
						};

						queue.add(() => downloadFile(urlMetadata));
					}
				}
			}
		}

		// Wait for all files to be downloaded
		await queue.onIdle();

		// Add zip file to bucket
		const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
		await env.BUCKET.put(`${id}@latest/download.zip`, zipBuffer);
	} catch (err) {
		throw new StatusError(500, 'Could not update bucket.');
	}
};

export { updateBucket };
