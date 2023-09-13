/* eslint-disable unicorn/prefer-module */
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unstable_dev, type UnstableDevWorker } from 'wrangler';

// TODO: Add tests to check bucket contents when Wrangler 3 supports it

describe('download worker', () => {
	let metadataWorker: UnstableDevWorker;
	let worker: UnstableDevWorker;

	beforeAll(async () => {
		metadataWorker = await unstable_dev(
			path.resolve(__dirname, '../../metadata/src/worker.ts'),
			{
				config: path.resolve(__dirname, '../../metadata/wrangler.toml'),
				experimental: { disableExperimentalWarning: true },
			},
		);
		worker = await unstable_dev(path.resolve(__dirname, '../src/worker.ts'), {
			config: path.resolve(__dirname, '../wrangler.toml'),
			experimental: { disableExperimentalWarning: true },
		});
	});

	afterAll(async () => {
		await metadataWorker.stop();
		await worker.stop();
	});

	it('should successfully generate zip with latest', async () => {
		const resp = await worker.fetch('/v1/abel@latest', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});

	it('should successfully generate zip with version', async () => {
		const resp = await worker.fetch('/v1/abel@5', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});

	it('should successfully download woff2 file with latest', async () => {
		const resp = await worker.fetch('/v1/abel@latest/latin-400-normal.woff2', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});

	it('should successfully download woff2 file with version', async () => {
		const resp = await worker.fetch('/v1/abel@5.0/latin-400-normal.woff2', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});

	it('should successfully download woff file with latest', async () => {
		const resp = await worker.fetch('/v1/abel@latest/latin-400-normal.woff', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});

	it('should successfully download woff file with version', async () => {
		const resp = await worker.fetch('/v1/abel@5.0.8/latin-400-normal.woff', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});

	it('should successfully download ttf file with latest', async () => {
		const resp = await worker.fetch('/v1/abel@latest/latin-400-normal.ttf', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});

	it('should successfully download ttf file with version', async () => {
		const resp = await worker.fetch('/v1/abel@5.0.8/latin-400-normal.ttf', {
			method: 'POST',
		});

		const text = await resp.text();
		expect(text).toEqual('Success.');
	});
});
