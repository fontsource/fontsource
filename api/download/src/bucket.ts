import { StatusError } from 'itty-router';

import { type Manifest, type ManifestVariable } from './manifest';
import { keepAwake, SLEEP_MINUTES } from './sleep';

type R2Object = string;

interface ListBucket {
	status: number;
	objects: R2Object[];
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

export const listBucket = async (prefix: string) => {
	keepAwake(SLEEP_MINUTES);

	const resp = await fetch(`https://upload.fontsource.org/list/${prefix}`, {
		headers: {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
		},
	});
	if (!resp.ok) {
		throw new StatusError(
			500,
			'Internal Server Error. Unable to fetch bucket.',
		);
	}

	return await resp.json<ListBucket>();
};

const abortMultiPartUpload = async (bucketPath: string, uploadId: string) => {
	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-abort`,
		{
			method: 'DELETE',
			headers: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
			},
			body: JSON.stringify({
				uploadId,
			}),
		},
	);

	if (!resp.ok) {
		const error = await resp.text();
		throw new StatusError(
			500,
			`Internal Server Error. Unable to abort multipart upload. ${error}`,
		);
	}
};

const initiateMultipartUpload = async (bucketPath: string) => {
	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-create`,
		{
			method: 'POST',
			headers: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
			},
		},
	);

	if (!resp.ok) {
		const error = await resp.text();
		throw new StatusError(
			500,
			`Internal Server Error. Unable to initiate multipart upload. ${error}`,
		);
	}

	const { uploadId } = await resp.json();
	return uploadId;
};

const uploadPart = async (
	bucketPath: string,
	uploadId: string,
	partNumber: number,
	partData: Uint8Array | ArrayBuffer,
) => {
	keepAwake(SLEEP_MINUTES);
	const formData = new FormData();
	formData.append('partNumber', partNumber.toString());
	formData.append('uploadId', uploadId);
	formData.append('file', new Blob([partData]));

	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-uploadpart`,
		{
			method: 'PUT',
			headers: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
			},
			body: formData,
		},
	);

	if (!resp.ok) {
		await abortMultiPartUpload(bucketPath, uploadId);

		const error = await resp.text();
		throw new StatusError(
			500,
			`Internal Server Error. Unable to upload part. ${error}`,
		);
	}

	return resp.headers.get('ETag') ?? '';
};

const completeMultipartUpload = async (
	bucketPath: string,
	uploadId: string,
	parts: any[],
) => {
	const resp = await fetch(
		`https://upload.fontsource.org/multipart/${bucketPath}?action=mpu-complete`,
		{
			method: 'POST',
			headers: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				uploadId,
				parts,
			}),
		},
	);

	if (!resp.ok) {
		await abortMultiPartUpload(bucketPath, uploadId);

		const error = await resp.text();
		throw new StatusError(
			500,
			`Internal Server Error. Unable to complete multipart upload. ${error}`,
		);
	}
};

export const putBucket = async (
	bucketPath: string,
	body: Uint8Array | ArrayBuffer,
) => {
	keepAwake(SLEEP_MINUTES);

	// We only use multipart uploads for files larger than 50MB since Cloudflare
	// limits the maximum request size to 100MB
	const partSize = 50 * 1024 * 1024;
	if (body.byteLength < partSize) {
		const resp = await fetch(
			`https://upload.fontsource.org/put/${bucketPath}`,
			{
				method: 'PUT',
				headers: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
				},
				body: new Blob([body]),
			},
		);

		if (!resp.ok) {
			const error = await resp.text();
			throw new StatusError(
				500,
				`Internal Server Error. Unable to upload file. ${error}`,
			);
		}

		return;
	}

	const uploadId = await initiateMultipartUpload(bucketPath);

	const parts = [];
	let start = 0;
	let partNumber = 1;

	// Upload buffers in parts
	while (start < body.byteLength) {
		const end = Math.min(start + partSize, body.byteLength);
		const partData = body.slice(start, end);

		const etag = await uploadPart(bucketPath, uploadId, partNumber, partData);

		parts.push({
			ETag: etag,
			PartNumber: partNumber,
		});

		start = end;
		partNumber++;
	}

	// Complete multipart upload
	await completeMultipartUpload(bucketPath, uploadId, parts);
};

export const getBucket = async (bucketPath: string) => {
	keepAwake(SLEEP_MINUTES);

	const resp = await fetch(`https://upload.fontsource.org/get/${bucketPath}`, {
		headers: {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
		},
	});
	if (!resp.ok) {
		throw new StatusError(
			500,
			'Internal Server Error. Unable to fetch bucket.',
		);
	}

	return resp;
};
