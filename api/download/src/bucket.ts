import { StatusError } from 'itty-router';

import { type Manifest, type ManifestVariable } from './manifest';

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

export const putBucket = async (
	bucketPath: string,
	body: Uint8Array | ArrayBuffer,
) => {
	const resp = await fetch(`https://upload.fontsource.org/put/${bucketPath}`, {
		method: 'PUT',
		headers: {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			Authorization: `Bearer ${process.env.UPLOAD_KEY!}`,
		},
		body,
	});
	if (!resp.ok) {
		const error = await resp.text();
		throw new StatusError(
			500,
			`Internal Server Error. Unable to upload to bucket. ${error}`,
		);
	}
};

export const getBucket = async (bucketPath: string) => {
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
