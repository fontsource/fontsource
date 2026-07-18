import type { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BuildVersionRequest } from '../shared/build';
import { createContainerServer } from './server';

const servers = new Set<ReturnType<typeof createContainerServer>>();

afterEach(async () => {
	await Promise.all(
		[...servers].map(
			(server) =>
				new Promise<void>((resolve, reject) => {
					server.close((error) => (error ? reject(error) : resolve()));
				}),
		),
	);
	servers.clear();
});

const startServer = async (
	buildArtifacts?: (request: BuildVersionRequest) => Promise<number>,
): Promise<string> => {
	const server = createContainerServer(buildArtifacts);
	servers.add(server);

	await new Promise<void>((resolve) => server.listen(0, resolve));
	const { port } = server.address() as AddressInfo;
	return `http://127.0.0.1:${port}`;
};

describe('container server', () => {
	it('serves the health endpoint', async () => {
		const baseUrl = await startServer();
		const response = await fetch(`${baseUrl}/health`);

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ status: 200 });
	});

	it('preserves the JSON not-found response', async () => {
		const baseUrl = await startServer();
		const response = await fetch(`${baseUrl}/missing`);

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			status: 404,
			error: 'Not Found.',
		});
	});

	it('runs one artifact build per container instance', async () => {
		const buildArtifacts = vi.fn(async () => 3);
		const baseUrl = await startServer(buildArtifacts);
		const payload = {
			mode: 'static',
			tag: { id: 'inter', version: '5.2.8' },
			metadata: { id: 'inter' },
		} as BuildVersionRequest;

		const response = await fetch(`${baseUrl}/build-version`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload),
		});

		expect(response.status).toBe(200);
		expect(buildArtifacts).toHaveBeenCalledWith(payload);
		await expect(response.json()).resolves.toEqual({
			state: 'ready',
			buildKey: 'build:inter@5.2.8:static',
		});

		const duplicate = await fetch(`${baseUrl}/build-version`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload),
		});

		expect(duplicate.status).toBe(409);
		expect(buildArtifacts).toHaveBeenCalledTimes(1);
	});
});
