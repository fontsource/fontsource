/* eslint-disable unicorn/prefer-module */

import { expect, it } from 'vitest';

import worker from '../src/worker';

const describe = setupMiniflareIsolatedStorage();

describe('download worker', () => {
	const env = getMiniflareBindings() satisfies Env;
	const ctx = new ExecutionContext();

	it('should download entire latest bucket', async () => {
		const fetchMock = getMiniflareFetchMock();

		// Mock response
		// https://data.jsdelivr.com/v1/packages/npm/@fontsource/${id}
		const versions = fetchMock.get('https://data.jsdelivr.com');
		versions
			.intercept({ path: '/v1/packages/npm/@fontsource/abel' })
			.reply(200, {
				versions: [{ version: '5.0.1' }],
			});

		const request = new Request(
			'http://localhost:8787/v1/download/abel@latest',
			{
				method: 'POST',
			},
		);
		const response = await worker.fetch(request, env, ctx);

		expect(response.status).toBe(201);
		// Check uploaded files
		const list = await env.BUCKET.list();
		expect(list.objects.map((item) => item.key)).toEqual([
			'abel@5.0.1/download.zip',
			'abel@5.0.1/latin-400-normal.ttf',
			'abel@5.0.1/latin-400-normal.woff',
			'abel@5.0.1/latin-400-normal.woff2',
		]);
	});

	it('should return 400 for invalid tag', async () => {
		const request = new Request('http://localhost:8787/v1/download/abel', {
			method: 'POST',
		});
		const response = await worker.fetch(request, env, ctx);

		expect(response.status).toBe(400);
	});

	it('should return 404 for invalid font id', async () => {
		const request = new Request(
			'http://localhost:8787/v1/download/invalid@latest',
			{
				method: 'POST',
			},
		);
		const response = await worker.fetch(request, env, ctx);

		expect(response.status).toBe(404);
	});
});
