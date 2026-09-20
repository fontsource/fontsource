import { readFile } from 'node:fs/promises';
import type { PutObjectCommandInput } from '@aws-sdk/client-s3';
import {
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3ServiceException,
} from '@aws-sdk/client-s3';
import { createFontContext } from '@fontsource-utils/core';
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
		const stored: { source: Uint8Array; preview?: PutObjectCommandInput } = {
			source: original,
		};
		let failUpload = true;
		let sourceReads = 0;
		s3.send.mockImplementation(async (command) => {
			if (command instanceof GetObjectCommand) {
				expect(command.input.Key).toBe(sourceKey);
				sourceReads++;
				return { Body: { transformToByteArray: async () => stored.source } };
			}
			expect(command.input.Key).toBe(previewKey);
			if (command instanceof PutObjectCommand) {
				if (failUpload) throw new Error('Upload interrupted');
				stored.preview = command.input;
				return {};
			}
			if (command instanceof HeadObjectCommand) {
				if (!stored.preview)
					throw new S3ServiceException({
						name: 'NotFound',
						$fault: 'client',
						$metadata: { httpStatusCode: 404 },
					});
				return {
					ContentLength: (stored.preview.Body as Uint8Array).byteLength,
					ContentType: stored.preview.ContentType,
					Metadata: stored.preview.Metadata,
				};
			}
			throw new Error('Unexpected S3 command');
		});
		const ctx = createFontContext();
		try {
			await expect(putSourcePreview(ctx, source)).rejects.toThrow(
				'Unable to archive preview',
			);
			expect(stored.preview).toBeUndefined();
			failUpload = false;
			await putSourcePreview(ctx, source);
			const preview = stored.preview;
			if (!preview) throw new Error('Preview was not stored');
			const bytes = preview.Body as Uint8Array;
			expect(preview.ContentType).toBe('font/woff2');
			expect(preview.Metadata?.sha256).toBe(sha256(bytes));
			expect(Buffer.from(bytes.subarray(0, 4)).toString()).toBe('wOF2');
			const reads = sourceReads;
			await putSourcePreview(ctx, source);
			expect(sourceReads).toBe(reads);
			expect(stored.preview).toBe(preview);
			expect(stored.source).toBe(original);

			stored.preview = undefined;
			stored.source = new Uint8Array([0]);
			await expect(putSourcePreview(ctx, source)).rejects.toThrow(
				'Unable to archive preview',
			);
			expect(stored.preview).toBeUndefined();
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
