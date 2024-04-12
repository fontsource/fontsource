import { error as errorDiary, info } from 'diary';
import { zipSync } from 'fflate';
import { StatusError } from 'itty-router';
import PQueue from 'p-queue';
// @ts-expect-error - no types
import woff2ttf from 'woff2sfnt-sfnt2woff';

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
import { keepAwake, SLEEP_MINUTES } from './sleep';
import { type IDResponse } from './types';

export const downloadFile = async (manifest: Manifest) => {
	const { id, subset, weight, style, extension, version, url } = manifest;

	const res = await fetch(url);
	info(`Downloading ${url}`);

	if (!res.ok) {
		throw new StatusError(500, `Could not fetch ${url}`);
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
			throw new StatusError(
				500,
				`Could not convert woff to ttf ${String(error)}`,
			);
		}
		if (!ttfBuffer) throw new StatusError(500, 'Could not convert woff to ttf');

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
		throw new StatusError(500, `Could not fetch ${url}`);
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
	metadata: IDResponse,
) => {
	// Check if zip file already exists
	const zipFile = await listBucket(`${id}@${version}/download.zip`);
	if (zipFile.objects.length > 0) return;

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

	// Download all files into memory
	const files: Record<string, any> = {};
	const zipQueue = new PQueue({ concurrency: 24 });

	// Download all files
	for (const file of fullManifest) {
		// eslint-disable-next-line @typescript-eslint/promise-function-async
		zipQueue
			.add(async () => {
				keepAwake(SLEEP_MINUTES);
				const path = bucketPath(file);
				const item = await getBucket(path);
				if (!item) {
					throw new StatusError(500, `Could not find ${path}`);
				}

				const buffer = await item.arrayBuffer();

				// Add to zip
				if (file.extension === 'woff2' || file.extension === 'woff') {
					const filename = `webfonts/${file.id}-${file.subset}-${file.weight}-${file.style}.${file.extension}`;
					// We do not need to compress woff2 files as they are already compressed
					files[filename] = [new Uint8Array(buffer), { level: 0 }];
				} else if (file.extension === 'ttf') {
					const filename = `ttf/${file.id}-${file.subset}-${file.weight}-${file.style}.${file.extension}`;
					// We do want to compress ttf files as they are not compressed with deflate
					files[filename] = new Uint8Array(buffer);
				} else {
					throw new StatusError(
						500,
						`Invalid file extension ${file.extension}`,
					);
				}
			})
			.catch((error) => {
				zipQueue.pause();
				zipQueue.clear();
				errorDiary(`Could not download ${bucketPath(file)}`);
				throw error;
			});
	}

	// Wait for all files to be downloaded
	await zipQueue.onIdle();

	// Add LICENSE file
	const license = await fetch(
		`https://cdn.jsdelivr.net/npm/@fontsource/${id}@${version}/LICENSE`,
	);
	if (!license.ok) {
		throw new StatusError(500, 'Could not find LICENSE file');
	}

	const licenseBuffer = await license.arrayBuffer();
	files.LICENSE = new Uint8Array(licenseBuffer);

	info(`Generating zip file for ${id}@${version}`);

	// Generate zip file of all fonts
	// We can't use async zip as it relies on worker_threads eval which is not supported
	// Bun (yet)
	const zipped = zipSync(files);

	// Add to bucket
	await putBucket(`${id}@${version}/download.zip`, zipped);
	info(`Successfully generated zip file for ${id}@${version}`);
};
