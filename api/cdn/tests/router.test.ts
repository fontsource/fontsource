/* eslint-disable unicorn/prefer-module */
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unstable_dev, type UnstableDevWorker } from 'wrangler';

describe('cdn worker', () => {
	let metadataWorker: UnstableDevWorker;
	let downloadWorker: UnstableDevWorker;
	let cdnWorker: UnstableDevWorker;

	beforeAll(async () => {
		metadataWorker = await unstable_dev(
			path.resolve(__dirname, '../../metadata/src/worker.ts'),
			{
				config: path.resolve(__dirname, '../../metadata/wrangler.toml'),
				experimental: { disableExperimentalWarning: true },
			},
		);
		downloadWorker = await unstable_dev(
			path.resolve(__dirname, '../../download/src/worker.ts'),
			{
				config: path.resolve(__dirname, '../../download/wrangler.toml'),
				experimental: { disableExperimentalWarning: true },
			},
		);
		cdnWorker = await unstable_dev(
			path.resolve(__dirname, '../src/worker.ts'),
			{
				config: path.resolve(__dirname, '../wrangler.toml'),
				experimental: { disableExperimentalWarning: true },
			},
		);
	});

	afterAll(async () => {
		await metadataWorker.stop();
		await downloadWorker.stop();
		await cdnWorker.stop();
	});

	it('should successfully', async () => {
		const resp = await cdnWorker.fetch(
			'/fonts/abel@latest/latin-400-normal.woff2',
		);
		if (resp) {
			const text = await resp.text();
			expect(true).toBe(true);
		}
	});
});
