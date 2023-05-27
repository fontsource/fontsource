import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
const describe = setupMiniflareIsolatedStorage();
import worker from '../src/worker';
import { fontlistQueries } from '../src/fontlist/types';
import { mockMetadata } from './helpers';

describe('fontlist worker', () => {
	const env = getMiniflareBindings() as Env;
	const ctx = new ExecutionContext();

	beforeEach(async () => {
		mockMetadata();
	});

	it('should return type as default request', async () => {
		const request = new Request('http://localhost:8787/fontlist');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);

		const body = await response.json();
		expect(body).toEqual({
			abel: 'google',
			'advent-pro': 'google',
			'material-icons': 'google',
			'material-symbols-outlined': 'google',
			yakuhanjp: 'other',
		});
	});

	const queryParams = fontlistQueries;
	for (const query of queryParams) {
		it(`should return return value of ${query} query string`, async () => {
			const request = new Request(`http://localhost:8787/fontlist?${query}`);
			const response = await worker.fetch(request, env, ctx);
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body).toMatchSnapshot();
		});
	}

	it('should return 400 for invalid query string', async () => {
		const request = new Request(`http://localhost:8787/fontlist?invalid`);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
	});

	it('should return 400 for multiple query strings', async () => {
		const request = new Request(`http://localhost:8787/fontlist?type&category`);
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
	});
});
