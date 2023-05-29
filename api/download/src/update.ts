import JSZip from 'jszip';
import { FileGenerator } from './types';
import { StatusError } from 'itty-router';
import PQueue from 'p-queue';
import { decompress } from 'wawoff2';

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
	{ id, weights, styles, subsets }: FileGenerator,
	env: Env
) => {
	// Generate zip file of all fonts
	const zip = new JSZip();
	const webfonts = zip.folder('webfonts');
	const ttf = zip.folder('ttf');

	// Create a queue
	const queue = new PQueue({ concurrency: 16 });

	const downloadFile = async ({
		id,
		subset,
		weight,
		style,
		extension,
	}: URLMetadata) => {
		const url = getFileUrl({ id, subset, weight, style, extension }, 'latest');
		const res = await fetch(url);
		if (!res.ok) throw new StatusError(404, `Could not find ${url}`);

		const buffer = await res.arrayBuffer();

		// Add to zip file
		if (!webfonts) throw new Error('could not generate webfonts folder');
		webfonts.file(`${id}-${subset}-${weight}-${style}.${extension}`, buffer);

		// Add to bucket
		await env.BUCKET.put(
			`${id}@latest/${subset}-${weight}-${style}.${extension}`,
			buffer
		);

		// If woff2, decompress and add to ttf folder
		if (extension === 'woff2') {
			const ttfBuffer = await decompress(new Uint8Array(buffer));
			if (!ttf) throw new Error('could not generate ttf folder');
			ttf.file(`${id}-${subset}-${weight}-${style}.ttf`, ttfBuffer);

			// Add to bucket
			await env.BUCKET.put(
				`${id}@latest/${subset}-${weight}-${style}.ttf`,
				ttfBuffer
			);
		}
	};

	let hasError;

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

					queue
						.add(() => downloadFile(urlMetadata))
						.catch((err) => {
							queue.pause();
							queue.clear();
							hasError = err;
						});
				}
			}
		}
	}

	// Wait for all files to be downloaded
	await queue.onIdle();
	if (hasError) throw hasError;

	// Add zip file to bucket
	const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
	await env.BUCKET.put(`${id}@latest/download.zip`, zipBuffer);
};

export { updateBucket };
