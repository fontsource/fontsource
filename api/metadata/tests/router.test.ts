import { expect, it } from 'vitest';

import worker from '../src/worker';

const describe = setupMiniflareIsolatedStorage();

describe('router', () => {
	const env = getMiniflareBindings() satisfies Env;
	const ctx = new ExecutionContext();

	it('should check for cors headers', async () => {
		const request = new Request('http://localhost:8787');
		const response = await worker.fetch(request, env, ctx);
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
	});
});
