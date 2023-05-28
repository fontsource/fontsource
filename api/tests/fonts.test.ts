import { beforeEach, expect, it } from 'vitest';
const describe = setupMiniflareIsolatedStorage();
import worker from '../src/worker';
import { mockMetadata } from './helpers';

describe('fonts worker', () => {
	const env = getMiniflareBindings() as Env;
	const ctx = new ExecutionContext();

	beforeEach(async () => {
		mockMetadata();
	});

	it('should return array of metadata default request', async () => {
		const request = new Request('http://localhost:8787/v1/fonts');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toMatchSnapshot();
	});

	it('should filter a single query param (string)', async () => {
		const request = new Request('http://localhost:8787/v1/fonts?type=other');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toMatchSnapshot();
	});

	it('should filter a single query param (string array)', async () => {
		const request = new Request(
			'http://localhost:8787/v1/fonts?subsets=arabic'
		);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toMatchSnapshot();
	});

	it('should filter a single query param (number array)', async () => {
		const request = new Request('http://localhost:8787/v1/fonts?weights=900');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toMatchSnapshot();
	});

	it('should filter a single query param (boolean)', async () => {
		const request = new Request('http://localhost:8787/v1/fonts?variable=true');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toMatchSnapshot();
	});

	it('should filter multiple query params', async () => {
		const request = new Request(
			'http://localhost:8787/v1/fonts?category=display&variable=false'
		);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toMatchSnapshot();
	});

	it('should filter comma separated query params', async () => {
		const request = new Request(
			'http://localhost:8787/v1/fonts?category=display,handwriting'
		);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toMatchSnapshot();
	});

	it('should return 400 for invalid query string', async () => {
		const request = new Request(`http://localhost:8787/v1/fonts?invalid`);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
	});
});
