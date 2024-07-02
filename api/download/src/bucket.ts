import { info } from 'diary';
import { StatusError } from 'itty-router';

import type { Manifest, ManifestVariable } from './manifest';
import { keepAwake, SLEEP_MINUTES } from './sleep';

type R2Object = string;

interface ListBucket {
	status: number;
	objects: R2Object[];
}

interface R2UploadedPart {
	etag: string;
	partNumber: number;
}

type BucketPath = Pick<
	Manifest,
	'id' | 'subset' | 'weight' | 'style' | 'extension' | 'version'
>;

type BucketPathVariable = Pick<
	ManifestVariable,
	'id' | 'subset' | 'axes' | 'style' | 'version'
>;

export const bucketPath = ({
	id,
	subset,
	weight,
	style,
	extension,
	version,
}: BucketPath) => `${id}@${version}/${subset}-${weight}-${style}.${extension}`;

export const bucketPathVariable = ({
	id,
	subset,
	axes,
	style,
	version,
}: BucketPathVariable) =>
	`${id}@${version}/variable/${subset}-${axes}-${style}.woff2`;

const handleBucketError = (resp: Response, msg: string) => {
	if (resp.status === 401) {
		throw new StatusError(
			401,
			'Unauthorized. Please check your UPLOAD_KEY environment variable.',
		);
	}

	throw new StatusError(500, `Internal Server Error. ${msg}`);
};

export const listBucket = async (prefix: string) => {
	keepAwake(SLEEP_MINUTES);

	const resp = await fetch(`https://upload.fontsource.org/list/${prefix}`, {
		headers: {
			Authorization: `Bearer ${
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				process.env.UPLOAD_KEY!
			}`,
		},
	});
	if (!resp.ok) {
		handleBucketError(resp, 'Unable to list bucket.');
	}

	return await resp.json<ListBucket>();
};

const abortMultiPartUpload = async (
	bucketPath: string,
	uploadId: string,
	msg?: string,
) => {
	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-abort`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					process.env.UPLOAD_KEY!
				}`,
			},
			body: JSON.stringify({
				uploadId,
			}),
		},
	);

	if (!resp.ok) {
		const error = await resp.text();
		const errorMsg = `Unable to abort multipart upload. ${error}`;
		handleBucketError(resp, msg ? `${msg} ${errorMsg}` : errorMsg);
	}
};

const initiateMultipartUpload = async (bucketPath: string): Promise<string> => {
	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-create`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					process.env.UPLOAD_KEY!
				}`,
			},
		},
	);

	if (!resp.ok) {
		const error = await resp.text();
		handleBucketError(resp, `Unable to initiate multipart upload. ${error}`);
	}

	const data = await resp.json();
	if (!data.uploadId) {
		throw new StatusError(
			500,
			`Internal Server Error. Upload ID is missing. ${JSON.stringify(data)}`,
		);
	}
	return data.uploadId;
};

const uploadPart = async (
	bucketPath: string,
	uploadId: string,
	partNumber: number,
	partData: Uint8Array | ArrayBuffer,
) => {
	keepAwake(SLEEP_MINUTES);
	const formData = new FormData();
	formData.append('partNumber', String(partNumber));
	formData.append('uploadId', uploadId);

	const blob = new Blob([partData]);
	const filename = `${bucketPath}-${partNumber}`;
	formData.append('file', blob, filename);

	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-uploadpart`,
		{
			method: 'PUT',
			headers: {
				Authorization: `Bearer ${
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					process.env.UPLOAD_KEY!
				}`,
			},
			body: formData,
		},
	);

	if (!resp.ok) {
		const error = await resp.text();
		const msg = `Unable to upload part. ${error}`;

		await abortMultiPartUpload(bucketPath, uploadId, msg);
		handleBucketError(resp, msg);
	}

	const data = await resp.json();
	if (!data.etag) {
		throw new StatusError(
			500,
			`Internal Server Error. ETag is missing. ${JSON.stringify(data)}`,
		);
	}
	return data.etag;
};

const completeMultipartUpload = async (
	bucketPath: string,
	uploadId: string,
	parts: R2UploadedPart[],
) => {
	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-complete`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${
					// biome-ignore lint/style/noNonNullAssertion: <explanation>
					process.env.UPLOAD_KEY!
				}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				uploadId,
				parts,
			}),
		},
	);

	if (!resp.ok) {
		const error = await resp.text();
		const msg = `Unable to complete multipart upload. ${error}`;

		await abortMultiPartUpload(bucketPath, uploadId, msg);
		handleBucketError(resp, msg);
	}
};

export const putBucket = async (
	bucketPath: string,
	body: Uint8Array | ArrayBuffer,
) => {
	// We only use multipart uploads for files larger than 80MB since Cloudflare
	// limits the maximum request size to 100MB
	const partSize = 80 * 1024 * 1024;
	if (body.byteLength < partSize) {
		keepAwake(SLEEP_MINUTES);
		const resp = await fetch(
			`https://upload.fontsource.org/put/${bucketPath}`,
			{
				method: 'PUT',
				headers: {
					Authorization: `Bearer ${
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						process.env.UPLOAD_KEY!
					}`,
				},
				body,
			},
		);

		if (!resp.ok) {
			const error = await resp.text();
			handleBucketError(resp, `Unable to upload file ${bucketPath}. ${error}`);
		}

		return;
	}

	info(`Uploading ${bucketPath} in parts with size ${body.byteLength}`);

	const uploadId = await initiateMultipartUpload(bucketPath);

	const parts: R2UploadedPart[] = [];
	let offset = 0;
	let partNumber = 1;

	// Upload buffers in parts
	while (offset < body.byteLength) {
		const end = Math.min(offset + partSize, body.byteLength);
		const partData = body.slice(offset, end);
		info(`Uploading part ${partNumber} with size ${partData.byteLength}`);

		const etag = await uploadPart(bucketPath, uploadId, partNumber, partData);

		parts.push({
			etag,
			partNumber,
		});

		offset = end;
		partNumber++;
	}

	// Complete multipart upload
	await completeMultipartUpload(bucketPath, uploadId, parts);
};

export const getBucket = async (bucketPath: string) => {
	keepAwake(SLEEP_MINUTES);

	const resp = await fetch(`https://upload.fontsource.org/get/${bucketPath}`, {
		headers: {
			Authorization: `Bearer ${
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				process.env.UPLOAD_KEY!
			}`,
		},
	});
	if (!resp.ok) {
		handleBucketError(resp, `Unable to fetch ${bucketPath}.`);
	}

	return resp;
};
