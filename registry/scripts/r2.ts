import type { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import {
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
	S3ServiceException,
} from '@aws-sdk/client-s3';
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
	// R2 does not support the SDK's default full-object CRC32 uploads; the
	// archive verifies each object against its registry SHA-256 instead.
	requestChecksumCalculation: 'WHEN_REQUIRED',
});

export const objectMatches = async (
	key: string,
	size: number,
	expectedSha256: string,
): Promise<boolean> => {
	let object: HeadObjectCommandOutput;
	try {
		object = await client.send(
			new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
		);
	} catch (error) {
		if (
			error instanceof S3ServiceException &&
			error.$metadata.httpStatusCode === 404
		) {
			return false;
		}
		throw new Error(`Unable to inspect ${key}`, { cause: error });
	}
	if (
		object.ContentLength !== size ||
		object.Metadata?.sha256 !== expectedSha256
	) {
		throw new Error(`Existing R2 object does not match ${key}`);
	}
	return true;
};

interface ImmutableObject {
	key: string;
	size: number;
	sha256: string;
	read: () => Promise<Uint8Array>;
}

export const putObject = async (object: ImmutableObject): Promise<void> => {
	if (await objectMatches(object.key, object.size, object.sha256)) return;

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
				IfNoneMatch: '*',
				Metadata: { sha256: object.sha256 },
			}),
		);
	} catch (error) {
		throw new Error(`Unable to upload ${object.key}`, { cause: error });
	}
};
