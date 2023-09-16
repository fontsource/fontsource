import { expect, it } from 'vitest';

import worker from '../src/worker';

const describe = setupMiniflareIsolatedStorage();

describe('auth', () => {
	const env = getMiniflareBindings() satisfies Env;
	const ctx = new ExecutionContext();

	it('should throw if no authorization header is given', async () => {
		const req = new Request('http://localhost:8787/list/list@1.0.0');
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(401);
		const body = await resp.json<any>();
		expect(body.error).toBe('Unauthorized. Missing authorization header.');
	});

	it('should throw if bearer scheme is not found in authorization header', async () => {
		const req = new Request('http://localhost:8787/list/list@1.0.0', {
			headers: {
				Authorization: 'invalid',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(400);
		const body = await resp.json<any>();
		expect(body.error).toBe('Bad Request. Malformed authorization header.');
	});

	it('should throw if bearer token is invalid', async () => {
		const req = new Request('http://localhost:8787/list/list@1.0.0', {
			headers: {
				Authorization: 'Bearer notthetoken',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(401);
		const body = await resp.json<any>();
		expect(body.error).toBe('Unauthorized. Invalid authorization token.');
	});
});

describe('list', () => {
	const env = getMiniflareBindings() satisfies Env;
	const ctx = new ExecutionContext();

	it('should list existing objects in bucket', async () => {
		await env.BUCKET.put('list@1.0.0/file.ttf', new ArrayBuffer(10));

		const req = new Request('http://localhost:8787/list/list@1.0.0/file.ttf', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer test',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(200);
		const body = await resp.json<any>();
		expect(body.objects).toEqual(['list@1.0.0/file.ttf']);

		await env.BUCKET.delete('list@1.0.0/file.ttf');
	});

	it('should return an empty array if no objects match prefix', async () => {
		const req = new Request('http://localhost:8787/list/does-not-exist', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer test',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(200);
		const body = await resp.json<any>();
		expect(body.objects).toEqual([]);
	});

	it('should throw if no prefix is given for list', async () => {
		const req = new Request('http://localhost:8787/list/', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer test',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(400);
		const body = await resp.json<any>();
		expect(body.error).toBe('Bad Request. Prefix is required.');
	});
});

describe('get', () => {
	const env = getMiniflareBindings() satisfies Env;
	const ctx = new ExecutionContext();

	it('should get existing object in bucket', async () => {
		await env.BUCKET.put('get@1.0.0/file.ttf', new ArrayBuffer(10));

		const req = new Request('http://localhost:8787/get/get@1.0.0/file.ttf', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer test',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(200);
		const body = await resp.arrayBuffer();
		expect(body.byteLength).toBe(10);

		await env.BUCKET.delete('get@1.0.0/file.ttf');
	});

	it('should 404 if object does not exist', async () => {
		const req = new Request('http://localhost:8787/get/does-not-exist', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer test',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(404);
		const body = await resp.json<any>();
		expect(body.error).toBe('Not Found. Object does-not-exist does not exist.');
	});

	it('should throw if no path is given for get', async () => {
		const req = new Request('http://localhost:8787/get/', {
			method: 'GET',
			headers: {
				Authorization: 'Bearer test',
			},
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(400);
		const body = await resp.json<any>();
		expect(body.error).toBe('Bad Request. Path is required.');
	});
});

describe('put', () => {
	const env = getMiniflareBindings() satisfies Env;
	const ctx = new ExecutionContext();

	it('should put new object in bucket', async () => {
		const req = new Request(
			'http://localhost:8787/put/put@1.0.0/new-file.ttf',
			{
				method: 'PUT',
				headers: {
					Authorization: 'Bearer test',
				},
				body: new ArrayBuffer(10),
			},
		);
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(201);

		const object = await env.BUCKET.get('put@1.0.0/new-file.ttf');
		const body = await object?.arrayBuffer();
		expect(body?.byteLength).toBe(10);
		await env.BUCKET.delete('put@1.0.0/new-file.ttf');
	});

	it('should overwrite existing object in bucket', async () => {
		await env.BUCKET.put('put@1.0.0/old-file.ttf', new ArrayBuffer(10));

		const req = new Request(
			'http://localhost:8787/put/put@1.0.0/old-file.ttf',
			{
				method: 'PUT',
				headers: {
					Authorization: 'Bearer test',
				},
				body: new ArrayBuffer(20),
			},
		);
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(201);

		const object = await env.BUCKET.get('put@1.0.0/old-file.ttf');
		const body = await object?.arrayBuffer();
		expect(body?.byteLength).toBe(20);
		await env.BUCKET.delete('put@1.0.0/old-file.ttf');
	});

	it('should throw if no path is given for put', async () => {
		const req = new Request('http://localhost:8787/put/', {
			method: 'PUT',
			headers: {
				Authorization: 'Bearer test',
			},
			body: new ArrayBuffer(10),
		});
		const resp = await worker.fetch(req, env, ctx);

		expect(resp.status).toBe(400);
		const body = await resp.json<any>();
		expect(body.error).toBe('Bad Request. Path is required.');
	});
});
