import { readFile } from 'node:fs/promises';
import {
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3ServiceException,
} from '@aws-sdk/client-s3';
import { createFontContext, inspectFont } from '@fontsource-utils/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

import { putCurrentObject, putObject, putSourcePreview } from './r2.ts';

describe('R2 source archive', () => {
	beforeEach(() => {
		s3.send.mockReset();
	});

	it('backfills a full-source preview, retries failed uploads, and reuses stored bytes', async () => {
		const original = await readFile(
			new URL(
				'../../packages/core/tests/fixtures/fonts/abel-latin-400-normal.ttf',
				import.meta.url,
			),
		);
		const source = { sha256: sha256(original), size: original.byteLength };
		const sourceKey = `sources/sha256/${source.sha256}`;
		const previewKey = `${sourceKey}/preview-1.woff2`;
		const objects = new Map<
			string,
			{
				body: Uint8Array;
				contentType: string;
				metadata: Record<string, string>;
			}
		>([
			[
				sourceKey,
				{
					body: original,
					contentType: 'font/ttf',
					metadata: { sha256: source.sha256 },
				},
			],
		]);
		let failUpload = true;
		let sourceReads = 0;
		s3.send.mockImplementation(async (command) => {
			const key = command.input.Key;
			const object = objects.get(key);
			if (command instanceof PutObjectCommand) {
				if (failUpload) throw new Error('Upload interrupted');
				objects.set(key, {
					body: command.input.Body as Uint8Array,
					contentType: command.input.ContentType ?? '',
					metadata: command.input.Metadata ?? {},
				});
				return {};
			}
			if (!object)
				throw new S3ServiceException({
					name: 'NotFound',
					$fault: 'client',
					$metadata: { httpStatusCode: 404 },
				});
			if (command instanceof HeadObjectCommand) {
				return {
					ContentLength: object.body.byteLength,
					ContentType: object.contentType,
					Metadata: object.metadata,
				};
			}
			if (command instanceof GetObjectCommand) {
				sourceReads++;
				return { Body: { transformToByteArray: async () => object.body } };
			}
			throw new Error('Unexpected S3 command');
		});
		const ctx = createFontContext();
		try {
			await expect(putSourcePreview(ctx, source)).rejects.toThrow(
				'Unable to archive preview',
			);
			expect(objects.has(previewKey)).toBe(false);
			failUpload = false;
			await putSourcePreview(ctx, source);
			const preview = objects.get(previewKey);
			if (!preview) throw new Error('Preview was not stored');
			expect(preview.contentType).toBe('font/woff2');
			expect(preview.metadata.sha256).toBe(sha256(preview.body));
			expect(await inspectFont(ctx, preview.body)).toEqual(
				await inspectFont(ctx, original),
			);
			const reads = sourceReads;
			await putSourcePreview(ctx, source);
			expect(sourceReads).toBe(reads);
			expect(objects.get(previewKey)).toBe(preview);
			expect(objects.get(sourceKey)?.body).toBe(original);

			objects.delete(previewKey);
			objects.set(sourceKey, {
				body: new Uint8Array([0]),
				contentType: 'font/ttf',
				metadata: { sha256: source.sha256 },
			});
			await expect(putSourcePreview(ctx, source)).rejects.toThrow(
				'Unable to archive preview',
			);
			expect(objects.has(previewKey)).toBe(false);
		} finally {
			ctx.destroy();
		}
	});

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
				key: 'sources/missing',
				size: body.byteLength,
				sha256: hash,
			}),
		).rejects.toThrow('Missing required R2 object sources/missing');

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
			contentType: 'font/ttf',
			read: async () => body,
		});

		const command = s3.send.mock.calls.find(
			([value]) => value instanceof PutObjectCommand,
		)?.[0];
		expect(command).toBeInstanceOf(PutObjectCommand);
		expect(command?.input).toMatchObject({
			Bucket: 'fontsource-registry',
			Key: 'sources/font',
			ContentType: 'font/ttf',
			Metadata: { sha256: hash },
		});

		s3.send
			.mockResolvedValueOnce({
				ContentLength: body.byteLength,
				Metadata: { sha256: hash },
			})
			.mockResolvedValueOnce({});
		const refresh = vi.fn(async () => body);
		await putObject({
			key: 'sources/font',
			size: body.byteLength,
			sha256: hash,
			contentType: 'font/ttf',
			read: refresh,
		});
		expect(refresh).toHaveBeenCalledOnce();

		s3.send.mockResolvedValueOnce({
			ContentLength: body.byteLength,
			ContentType: 'font/ttf',
			Metadata: { sha256: hash },
		});
		const read = vi.fn(async () => body);
		await putObject({
			key: 'sources/font',
			size: body.byteLength,
			sha256: hash,
			contentType: 'font/ttf',
			read,
		});
		expect(read).not.toHaveBeenCalled();
	});

	it('overwrites the current snapshot pointer', async () => {
		const body = new TextEncoder().encode('current');
		s3.send.mockClear();
		s3.send.mockResolvedValueOnce({});

		await putCurrentObject(body);

		const command = s3.send.mock.calls[0]?.[0];
		expect(command).toBeInstanceOf(PutObjectCommand);
		expect(command?.input).toEqual({
			Bucket: 'fontsource-registry',
			Key: 'current.json',
			Body: body,
			ContentType: 'application/json',
		});
	});
});
