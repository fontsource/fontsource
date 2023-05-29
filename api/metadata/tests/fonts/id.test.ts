import { beforeEach, expect, it } from 'vitest';
const describe = setupMiniflareIsolatedStorage();
import worker from '../../src/worker';
import { mockMetadata } from '../helpers';

describe('fonts id worker', () => {
	const env = getMiniflareBindings() as Env;
	const ctx = new ExecutionContext();

	beforeEach(async () => {
		mockMetadata();
	});

	it('should return normal id response', async () => {
		const request = new Request('http://localhost:8787/v1/fonts/akshar');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(200);
		const data = await response.json();
		expect(data).toMatchSnapshot();
	});

	it('should return 404 for invalid id', async () => {
		const request = new Request('http://localhost:8787/v1/fonts/invalid-id');
		const response = await worker.fetch(request, env, ctx);
		expect(response.status).toBe(404);
	});
});
