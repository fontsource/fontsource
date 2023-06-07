import { beforeEach, expect, it } from 'vitest';

import { fontlistQueries } from '../src/fontlist/types';
import worker from '../src/worker';
import { mockMetadata } from './helpers';

const describe = setupMiniflareIsolatedStorage();

describe('fontlist worker', () => {
	const env = getMiniflareBindings() satisfies Env;
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
			akshar: 'google',
			alegreya: 'google',
			archivo: 'google',
			ballet: 'google',
			fraunces: 'google',
			'material-icons': 'google',
			'material-symbols-outlined': 'google',
			'noto-sans-jp': 'google',
			'noto-serif-hk': 'google',
			recursive: 'google',
			'roboto-flex': 'google',
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
		const request = new Request('http://localhost:8787/fontlist?invalid');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
	});

	it('should return 400 for multiple query strings', async () => {
		const request = new Request('http://localhost:8787/fontlist?type&category');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(400);
	});
});
