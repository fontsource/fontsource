import type { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import {
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
	S3ServiceException,
} from '@aws-sdk/client-s3';
import { convertFont, type FontContext } from '@fontsource-utils/core';
import { REGISTRY_PREVIEW_VERSION } from '../../api/shared/registry.ts';
import { sha256 } from './shared.ts';

const BUCKET = 'fontsource-registry';

const requireEnv = (name: string): string => {
	const value = process.env[name];
	if (!value) throw new Error(`Missing environment variable ${name}`);
	return value;
};

const client = new S3Client({
	endpoint: requireEnv('REGISTRY_R2_ENDPOINT'),
	credentials: {
		accessKeyId: requireEnv('REGISTRY_R2_ACCESS_KEY_ID'),
		secretAccessKey: requireEnv('REGISTRY_R2_SECRET_ACCESS_KEY'),
	},
	region: 'auto',
	// Archive requests are idempotent, so tolerate transient R2 connectivity
	// failures beyond the SDK's default three attempts.
	maxAttempts: 10,
	// R2 does not support the SDK's default full-object CRC32 uploads; the
	// archive verifies each object against its registry SHA-256 instead.
	requestChecksumCalculation: 'WHEN_REQUIRED',
});

const headObject = async (
	key: string,
): Promise<HeadObjectCommandOutput | undefined> => {
	try {
		return await client.send(
			new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
		);
	} catch (error) {
		if (
			error instanceof S3ServiceException &&
			error.$metadata.httpStatusCode === 404
		) {
			return undefined;
		}
		throw new Error(`Unable to inspect ${key}`, { cause: error });
	}
};

const objectMatches = async (
	key: string,
	size: number,
	expectedSha256: string,
	contentType?: string,
): Promise<boolean> => {
	const object = await headObject(key);
	if (!object) return false;
	if (
		object.ContentLength !== size ||
		object.Metadata?.sha256 !== expectedSha256
	) {
		throw new Error(`Existing R2 object does not match ${key}`);
	}
	return !contentType || object.ContentType === contentType;
};

interface ImmutableObject {
	key: string;
	size: number;
	sha256: string;
	contentType?: string;
	read?: () => Promise<Uint8Array>;
}

export const putObject = async (object: ImmutableObject): Promise<void> => {
	if (
		await objectMatches(
			object.key,
			object.size,
			object.sha256,
			object.contentType,
		)
	)
		return;
	if (!object.read) {
		throw new Error(`Missing required R2 object ${object.key}`);
	}

	const body = await object.read();
	if (body.byteLength !== object.size || sha256(body) !== object.sha256) {
		throw new Error(`Object body does not match ${object.key}`);
	}

	try {
		await client.send(
			new PutObjectCommand({
				Bucket: BUCKET,
				Key: object.key,
				Body: body,
				ContentType: object.contentType,
				Metadata: { sha256: object.sha256 },
			}),
		);
	} catch (error) {
		throw new Error(`Unable to upload ${object.key}`, { cause: error });
	}
};

export const putSourcePreview = async (
	ctx: FontContext,
	source: Pick<ImmutableObject, 'sha256' | 'size'>,
): Promise<void> => {
	const sourceKey = `sources/sha256/${source.sha256}`;
	const key = `${sourceKey}/preview-${REGISTRY_PREVIEW_VERSION}.woff2`;
	// Keep each encoding version immutable, even after the encoder is upgraded.
	const existing = await headObject(key);
	if (existing) {
		if (
			existing.ContentType !== 'font/woff2' ||
			!existing.ContentLength ||
			!/^[0-9a-f]{64}$/.test(existing.Metadata?.sha256 ?? '')
		) {
			throw new Error(`Invalid archived preview ${key}`);
		}
		return;
	}

	try {
		// Read the verified archive, including sources without a GitHub upstream.
		const original = await client.send(
			new GetObjectCommand({ Bucket: BUCKET, Key: sourceKey }),
		);
		const bytes = await original.Body?.transformToByteArray();
		if (
			!bytes ||
			bytes.byteLength !== source.size ||
			sha256(bytes) !== source.sha256
		) {
			throw new Error(`Object body does not match ${sourceKey}`);
		}
		const [preview] = await convertFont(ctx, bytes, ['woff2'], source.sha256);
		await putObject({
			key,
			size: preview.data.byteLength,
			sha256: sha256(preview.data),
			contentType: 'font/woff2',
			read: async () => preview.data,
		});
	} catch (error) {
		throw new Error(`Unable to archive preview ${key}`, { cause: error });
	}
};

export const putCurrentObject = async (body: Uint8Array): Promise<void> => {
	try {
		await client.send(
			new PutObjectCommand({
				Bucket: BUCKET,
				Key: 'current.json',
				Body: body,
				ContentType: 'application/json',
			}),
		);
	} catch (error) {
		throw new Error('Unable to upload current.json', { cause: error });
	}
};
