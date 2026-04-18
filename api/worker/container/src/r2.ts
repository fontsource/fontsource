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
		body: body as unknown as BodyInit,
		headers,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Failed to upload ${key}: ${response.status} ${text || response.statusText}`,
		);
	}
};
