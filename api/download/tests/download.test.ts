import { beforeEach, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
const describe = setupMiniflareIsolatedStorage();
import worker from '../src/worker';

describe('download worker', () => {
	const env = getMiniflareBindings() as Env;
	const ctx = new ExecutionContext();

	beforeEach(async () => {
		const fetchMock = getMiniflareFetchMock();
		// Throw when no matching mocked request is found
		fetchMock.disableNetConnect();

		// Handlers
		// We want this to be the default response for all requests
		const origin = fetchMock.get('https://cdn.jsdelivr.net');
		origin
			.intercept({
				method: 'GET',
				path: '/npm/@fontsource/roboto@latest/files/roboto-latin-400-normal.woff2',
			})
			.reply(
				200,
				await fs.readFile(
					path.resolve(__dirname, './fixtures/roboto-latin-400-normal.woff2')
				)
			);
		origin
			.intercept({
				method: 'GET',
				path: '/npm/@fontsource/roboto@latest/files/roboto-latin-400-normal.woff',
			})
			.reply(
				200,
				await fs.readFile(
					path.resolve(__dirname, './fixtures/roboto-latin-400-normal.woff')
				)
			);

		// Mock invalids
		origin
			.intercept({
				method: 'GET',
				path: '/npm/@fontsource/invalid@latest/files/invalid-latin-400-normal.woff2',
			})
			.reply(404, 'test');
		origin
			.intercept({
				method: 'GET',
				path: '/npm/@fontsource/invalid@latest/files/invalid-latin-400-normal.woff',
			})
			.reply(404, 'test');
	});

	it('should return type as default request', async () => {
		const request = new Request('http://localhost:8787/v1/download/roboto', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id: 'roboto',
				subsets: ['latin'],
				weights: [400],
				styles: ['normal'],
			}),
		});
		const response = await worker.fetch(request, env, ctx);

		expect(response.status).toBe(200);
		// Check uploaded files
		expect((await env.BUCKET.list()).objects.map((item) => item.key)).toEqual([
			'roboto@latest/download.zip',
			'roboto@latest/latin-400-normal.ttf',
			'roboto@latest/latin-400-normal.woff',
			'roboto@latest/latin-400-normal.woff2',
		]);
	});

	it('should return 404 for invalid font id', async () => {
		const request = new Request('http://localhost:8787/v1/download/invalid', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				id: 'invalid',
				subsets: ['latin'],
				weights: [400],
				styles: ['normal'],
			}),
		});
		const response = await worker.fetch(request, env, ctx);

		expect(response.status).toBe(404);
	});
});
