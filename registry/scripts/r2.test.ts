import { PutObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { describe, expect, it, vi } from 'vitest';
import { sha256 } from './shared.ts';

const s3 = vi.hoisted(() => {
	process.env.REGISTRY_R2_ENDPOINT = 'https://example.r2.cloudflarestorage.com';
	process.env.REGISTRY_R2_ACCESS_KEY_ID = 'access-key';
	process.env.REGISTRY_R2_SECRET_ACCESS_KEY = 'secret-key';
	return { send: vi.fn() };
});

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
	const original = await importOriginal<typeof import('@aws-sdk/client-s3')>();
	return {
		...original,
		S3Client: class {
			send = s3.send;
		},
	};
});

import { putObject } from './r2.ts';

describe('R2 source archive', () => {
	it('verifies bodies and conditionally uploads only missing objects', async () => {
		const body = new TextEncoder().encode('font');
		const hash = sha256(body);
		const missing = new S3ServiceException({
			name: 'NotFound',
			$fault: 'client',
			$metadata: { httpStatusCode: 404 },
		});

		s3.send.mockRejectedValueOnce(missing);
		await expect(
			putObject({
				key: 'sources/font',
				size: body.byteLength,
				sha256: hash,
				read: async () => new Uint8Array([0]),
			}),
		).rejects.toThrow('Object body does not match sources/font');

		s3.send.mockRejectedValueOnce(missing).mockResolvedValueOnce({});
		await putObject({
			key: 'sources/font',
			size: body.byteLength,
			sha256: hash,
			read: async () => body,
		});

		const command = s3.send.mock.calls[2]?.[0];
		expect(command).toBeInstanceOf(PutObjectCommand);
		expect(command?.input).toMatchObject({
			Bucket: 'fontsource-registry',
			Key: 'sources/font',
			IfNoneMatch: '*',
			Metadata: { sha256: hash },
		});

		s3.send.mockResolvedValueOnce({
			ContentLength: body.byteLength,
			Metadata: { sha256: hash },
		});
		const read = vi.fn(async () => body);
		await putObject({
			key: 'sources/font',
			size: body.byteLength,
			sha256: hash,
			read,
		});
		expect(read).not.toHaveBeenCalled();
	});
});
