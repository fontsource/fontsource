import { AwsClient } from 'aws4fetch';

const requireEnv = (key: string): string => {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Missing container environment variable "${key}".`);
	}
	return value;
};

const client = (() => {
	const endpoint = requireEnv('R2_S3_ENDPOINT').replace(/\/+$/, '');
	const bucket = requireEnv('FONTS_BUCKET_NAME');

	return {
		bucket,
		endpoint,
		client: new AwsClient({
			accessKeyId: requireEnv('R2_ACCESS_KEY_ID'),
			secretAccessKey: requireEnv('R2_SECRET_ACCESS_KEY'),
			service: 's3',
			region: 'auto',
		}),
	};
})();

const buildObjectUrl = (key: string): string =>
	`${client.endpoint}/${client.bucket}/${key}`;

interface PutObjectMetadata {
	cacheControl?: string;
	contentDisposition?: string;
	contentType?: string;
}

/**
 * Writes one object directly to the configured R2 bucket from the container.
 */
export const putObject = async (
	key: string,
	body: Uint8Array,
	metadata: PutObjectMetadata = {},
): Promise<void> => {
	const headers: Record<string, string> = {
		'Content-Length': String(body.byteLength),
	};

	if (metadata.cacheControl) {
		headers['Cache-Control'] = metadata.cacheControl;
	}

	if (metadata.contentDisposition) {
		headers['Content-Disposition'] = metadata.contentDisposition;
	}

	if (metadata.contentType) {
		headers['Content-Type'] = metadata.contentType;
	}

	const response = await client.client.fetch(buildObjectUrl(key), {
		method: 'PUT',
		body: body.slice(),
		headers,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Failed to upload ${key}: ${response.status} ${text || response.statusText}`,
		);
	}

	console.log(`[r2] PUT ${key} (${body.byteLength} bytes)`);
};

/**
 * Lists all object keys under a given prefix via S3 ListObjectsV2.
 * Handles pagination automatically.
 */
export const listKeys = async (prefix: string): Promise<Set<string>> => {
	const keys = new Set<string>();
	let token: string | undefined;
	let pages = 0;

	do {
		const url = new URL(`${client.endpoint}/${client.bucket}`);
		url.searchParams.set('list-type', '2');
		url.searchParams.set('prefix', prefix);
		if (token) {
			url.searchParams.set('continuation-token', token);
		}

		const response = await client.client.fetch(url.toString());
		if (!response.ok) {
			console.warn(
				`[r2] ListObjectsV2 failed for prefix="${prefix}": ${response.status}`,
			);
			break;
		}

		pages++;
		const xml = await response.text();
		for (const [, key] of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) {
			keys.add(key);
		}

		token = /<IsTruncated>true<\/IsTruncated>/.test(xml)
			? xml.match(
					/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/,
				)?.[1]
			: undefined;
	} while (token);

	console.log(
		`[r2] LIST prefix="${prefix}" found ${keys.size} keys (${pages} page${pages !== 1 ? 's' : ''})`,
	);

	return keys;
};

/**
 * Downloads an object's bytes from R2. Returns null when the key does not exist.
 */
export const getObjectBytes = async (
	key: string,
): Promise<Uint8Array | null> => {
	const response = await client.client.fetch(buildObjectUrl(key));
	if (!response.ok) {
		console.log(`[r2] GET ${key} — not found`);
		return null;
	}
	const bytes = new Uint8Array(await response.arrayBuffer());
	console.log(`[r2] GET ${key} (${bytes.byteLength} bytes)`);
	return bytes;
};
