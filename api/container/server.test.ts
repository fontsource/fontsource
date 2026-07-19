import { describe, expect, it, vi } from 'vitest';
import type { BuildVersionRequest } from '../shared/build';
import { createContainerApp } from './server';

describe('container server', () => {
	it('serves the health endpoint', async () => {
		const response = await createContainerApp().request('/health');

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toEqual({ status: 200 });
	});

	it('preserves the JSON not-found response', async () => {
		const response = await createContainerApp().request('/missing');

		expect(response.status).toBe(404);
		await expect(response.json()).resolves.toEqual({
			status: 404,
			error: 'Not Found.',
		});
	});

	it('runs one artifact build per container instance', async () => {
		const buildArtifacts = vi.fn(async () => 3);
		const app = createContainerApp(buildArtifacts);
		const payload = {
			mode: 'static',
			tag: { id: 'inter', version: '5.2.8' },
			metadata: { id: 'inter' },
		} as BuildVersionRequest;
		const request = {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload),
		};

		const response = await app.request('/build-version', request);

		expect(response.status).toBe(200);
		expect(buildArtifacts).toHaveBeenCalledWith(payload);
		await expect(response.json()).resolves.toEqual({
			state: 'ready',
			buildKey: 'build:inter@5.2.8:static',
		});

		const duplicate = await app.request('/build-version', request);

		expect(duplicate.status).toBe(409);
		expect(buildArtifacts).toHaveBeenCalledTimes(1);
	});
});
