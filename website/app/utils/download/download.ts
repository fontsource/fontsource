import JSZip from 'jszip';
import PQueue from 'p-queue';
// @ts-expect-error - no types
import woff2ttf from 'woff2sfnt-sfnt2woff';

import { type Metadata } from '../types';
import {
	bucketPath,
	bucketPathVariable,
	getBucket,
	listBucket,
	putBucket,
} from './bucket';
import {
	generateManifest,
	type Manifest,
	type ManifestVariable,
} from './manifest';

export const downloadFile = async (manifest: Manifest) => {
	const { id, subset, weight, style, extension, version, url } = manifest;

	const res = await fetch(url);

	if (!res.ok) {
		throw new Response(`Could not fetch ${url}`, { status: 500 });
	}

	const buffer = await res.arrayBuffer();

	// Add to bucket
	await putBucket(bucketPath(manifest), buffer);

	// If woff, decompress and add to ttf folder
	if (extension === 'woff') {
		let ttfBuffer;
		try {
			ttfBuffer = await woff2ttf.toSfnt(new Uint8Array(buffer));
		} catch (error) {
			throw new Response(`Could not convert woff to ttf ${String(error)}`, {
				status: 500,
			});
		}
		if (!ttfBuffer)
			throw new Response('Could not convert woff to ttf', { status: 500 });

		// Add to bucket
		await putBucket(
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

export const downloadVariableFile = async (manifest: ManifestVariable) => {
	const { url } = manifest;
	const res = await fetch(url);

	if (!res.ok) {
		throw new Response(`Could not fetch ${url}`, { status: 500 });
	}

	const buffer = await res.arrayBuffer();

	// Add to bucket
	await putBucket(bucketPathVariable(manifest), buffer);
};

export const downloadManifest = async (manifest: Manifest[]) => {
	// Create a queue
	const queue = new PQueue({ concurrency: 24 });
	let hasError: Error | undefined;

	// Download all files
	for (const file of manifest) {
		// eslint-disable-next-line @typescript-eslint/promise-function-async
		queue
			.add(async () => {
				await downloadFile(file);
			})
			// eslint-disable-next-line no-loop-func
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

export const generateZip = async (
	id: string,
	version: string,
	metadata: Metadata,
) => {
	// Check if zip file already exists
	const zipFile = await listBucket(`${id}@${version}/download.zip`);
	if (zipFile.objects.length > 0) return;

	// Generate zip file of all fonts
	const zip = new JSZip();
	const webfonts = zip.folder('webfonts');
	const ttf = zip.folder('ttf');

	const fullManifest = generateManifest(`${id}@${version}`, metadata);
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
		const item = await getBucket(bucketPath(file));
		if (!item) {
			throw new Response(`Could not find ${bucketPath(file)}`, { status: 500 });
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
			throw new Response(`Invalid file extension ${file.extension}`, {
				status: 500,
			});
		}
	}

	// Add LICENSE file
	const license = await fetch(
		`https://cdn.jsdelivr.net/npm/@fontsource/${id}@${version}/LICENSE`,
	);
	if (!license.ok) {
		throw new Response('Could not find LICENSE file', { status: 500 });
	}

	const licenseBuffer = await license.arrayBuffer();
	zip.file('LICENSE', licenseBuffer);

	// Add to bucket
	const zipBuffer = await zip.generateAsync({ type: 'uint8array' });
	await putBucket(`${id}@${version}/download.zip`, zipBuffer);
};
