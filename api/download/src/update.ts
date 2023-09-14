import { type IDResponse } from 'common-api/types';
import { StatusError } from 'itty-router';
import JSZip from 'jszip';
import PQueue from 'p-queue';
// @ts-expect-error - no types
import woff2ttf from 'woff2sfnt-sfnt2woff';

import { generateManifest } from './manifest';
import { type Manifest } from './types';
import { bucketPath } from './util';

const downloadFile = async (manifest: Manifest, env: Env) => {
	const { id, subset, weight, style, extension, version } = manifest;
	const url = manifest.url;

	const res = await fetch(url);

	if (!res.ok) {
		throw new StatusError(404, `Could not find ${url}`);
	}

	const buffer = await res.arrayBuffer();

	// Add to bucket
	await env.BUCKET.put(bucketPath(manifest), buffer);

	// If woff, decompress and add to ttf folder
	if (extension === 'woff') {
		let ttfBuffer;
		try {
			ttfBuffer = await woff2ttf.toSfnt(new Uint8Array(buffer));
		} catch {
			throw new StatusError(500, 'could not convert woff to ttf');
		}
		if (!ttfBuffer) throw new StatusError(500, 'could not convert woff to ttf');

		// Add to bucket
		await env.BUCKET.put(
			bucketPath({
				id,
				subset,
				weight,
				style,
				extension: 'ttf',
				version,
			}),
			ttfBuffer,
		);
	}
};

const downloadManifest = async (manifest: Manifest[], env: Env) => {
	// Create a queue
	const queue = new PQueue({ concurrency: 4 });
	let hasError: Error | undefined;

	// Download all files
	for (const file of manifest) {
		// eslint-disable-next-line @typescript-eslint/promise-function-async
		queue
			.add(async () => {
				await downloadFile(file, env);
			})
			.catch((error) => {
				queue.pause();
				queue.clear();
				hasError = error;
			});
	}

	// Wait for all files to be downloaded
	await queue.onIdle();
	if (hasError) throw hasError;
};

const generateZip = async (
	id: string,
	version: string,
	metadata: IDResponse,
	req: Request,
	env: Env,
) => {
	// Check if zip file already exists
	const zipFile = await env.BUCKET.get(`${id}@${version}/download.zip`);
	if (zipFile) return;

	// Generate zip file of all fonts
	const zip = new JSZip();
	const webfonts = zip.folder('webfonts');
	const ttf = zip.folder('ttf');

	const fullManifest = await generateManifest(`${id}@${version}`, metadata);
	// For every woff file, generate an equivalent manifest entry for ttf
	for (const file of fullManifest) {
		if (file.extension === 'woff') {
			fullManifest.push({
				...file,
				extension: 'ttf',
			});
		}
	}

	for (const file of fullManifest) {
		const item = await env.BUCKET.get(bucketPath(file));
		if (!item) {
			throw new StatusError(500, `Could not find ${file.url}`);
		}

		const buffer = await item.arrayBuffer();

		// Add to zip
		if (file.extension === 'woff2' || file.extension === 'woff') {
			webfonts?.file(
				`${file.id}-${file.subset}-${file.weight}-${file.style}.${file.extension}`,
				buffer,
			);
		} else if (file.extension === 'ttf') {
			ttf?.file(
				`${file.id}-${file.subset}-${file.weight}-${file.style}.${file.extension}`,
				buffer,
			);
		} else {
			throw new StatusError(500, `Invalid file extension ${file.extension}`);
		}
	}

	// Add LICENSE file
	const license = await fetch(
		`https://cdn.jsdelivr.net/npm/@fontsource/${id}@${version}/LICENSE`,
	);
	if (!license.ok) {
		throw new StatusError(500, 'Could not find LICENSE file');
	}

	const licenseBuffer = await license.arrayBuffer();
	zip.file('LICENSE', licenseBuffer);

	// Add to bucket
	const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
	await env.BUCKET.put(`${id}@${version}/download.zip`, zipBuffer);
};

export { bucketPath, downloadFile, downloadManifest, generateZip };
