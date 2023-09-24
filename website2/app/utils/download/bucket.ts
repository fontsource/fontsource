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
		throw new Response('Internal Server Error. Unable to fetch bucket.', {
			status: 500,
		});
	}

	const objects = (await resp.json()) as ListBucket;
	return objects;
};

export const putBucket = async (bucketPath: string, body: ArrayBuffer) => {
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
		throw new Response(
			`Internal Server Error. Unable to upload to bucket. ${error}`,
			{
				status: 500,
			},
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
		throw new Response('Internal Server Error. Unable to fetch bucket.', {
			status: 500,
		});
	}

	return resp;
};
