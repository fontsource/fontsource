import { beforeEach, expect, it } from 'vitest';
const describe = setupMiniflareIsolatedStorage();
import worker from '../src/worker';

describe('download worker', () => {
	const env = getMiniflareBindings() as Env;
	const ctx = new ExecutionContext();

	it('should return type as default request', async () => {
		const request = new Request('http://localhost:8787/v1/download/roboto');
		const response = await worker.fetch(request, env, ctx);

		expect(response.status).toBe(200);
	});
});
