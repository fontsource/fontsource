import { once } from 'node:events';
import { createServer } from 'node:http';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { sha256 } from './shared.ts';

describe('archive cutover over S3', () => {
	it('verifies migrated bytes, retries partial uploads, and leaves the live snapshot unchanged', async () => {
		const revision = 'a'.repeat(40);
		const bodies = [Buffer.from('{"id":"abel"}'), Buffer.from('[]')];
		const paths = ['families/abel.json', 'families.json'];
		const pointer = Buffer.from(
			JSON.stringify({ schemaVersion: 1, registryRevision: revision }),
		);
		const manifest = {
			schemaVersion: 1,
			registryRevision: revision,
			registry: [],
			sources: [],
			views: bodies.map((body, i) => ({
				path: paths[i],
				size: body.length,
				sha256: sha256(body),
			})),
		};
		const stored = new Map<
			string,
			{ body: Buffer; hash?: string; contentType?: string }
		>([
			['current.json', { body: pointer }],
			[
				`snapshots/${revision}/manifest.json`,
				{ body: Buffer.from(JSON.stringify(manifest)) },
			],
			...bodies.map((body, i): [string, { body: Buffer }] => [
				`snapshots/${revision}/api/${paths[i]}`,
				{ body },
			]),
		]);
		const writes: string[] = [];
		let rejectIndex = true;
		const indexKey = `snapshots/v2/${revision}/index.json`;
		const server = createServer(async (request, response) => {
			const key = decodeURIComponent(
				new URL(request.url ?? '/', 'http://localhost').pathname,
			).replace(/^\/fontsource-registry\//, '');
			if (request.method === 'PUT') {
				const chunks: Buffer[] = [];
				for await (const chunk of request) chunks.push(Buffer.from(chunk));
				if (rejectIndex && key === indexKey) {
					response.writeHead(400, { 'Content-Type': 'application/xml' });
					response.end(
						'<Error><Code>InvalidRequest</Code><Message>Injected failure</Message></Error>',
					);
					return;
				}
				writes.push(key);
				stored.set(key, {
					body: Buffer.concat(chunks),
					hash: request.headers['x-amz-meta-sha256']?.toString(),
					contentType: request.headers['content-type'],
				});
				response.end();
				return;
			}
			const object = stored.get(key);
			if (!object) {
				response.writeHead(404);
				response.end();
				return;
			}
			response.setHeader('Content-Length', object.body.length);
			if (object.hash) response.setHeader('x-amz-meta-sha256', object.hash);
			if (object.contentType)
				response.setHeader('Content-Type', object.contentType);
			response.end(request.method === 'HEAD' ? undefined : object.body);
		});
		server.listen(0, '127.0.0.1');
		await once(server, 'listening');
		onTestFinished(
			() =>
				new Promise<void>((resolve, reject) => {
					server.close((error) => (error ? reject(error) : resolve()));
					server.closeAllConnections();
				}),
		);
		const address = server.address();
		if (!address || typeof address === 'string')
			throw new Error('Missing test server address');
		vi.stubEnv('REGISTRY_R2_ENDPOINT', `http://127.0.0.1:${address.port}`);
		vi.stubEnv('REGISTRY_R2_ACCESS_KEY_ID', 'test');
		vi.stubEnv('REGISTRY_R2_SECRET_ACCESS_KEY', 'test');
		onTestFinished(() => {
			vi.unstubAllEnvs();
		});
		const { migrateArchive } = await import('./migrate-archive.ts');

		const firstLegacyKey = `snapshots/${revision}/api/${paths[0]}`;
		stored.set(firstLegacyKey, { body: Buffer.from('corrupt') });
		await expect(migrateArchive()).rejects.toThrow(
			'Object body does not match',
		);
		expect(stored.has(indexKey)).toBe(false);
		expect(stored.get('current.json')?.body).toEqual(pointer);

		stored.set(firstLegacyKey, { body: bodies[0] });
		await expect(migrateArchive()).rejects.toThrow('Unable to upload');
		expect(stored.has(`snapshots/v2/${revision}/manifest.json`)).toBe(false);
		expect(stored.get('current.json')?.body).toEqual(pointer);

		rejectIndex = false;
		writes.length = 0;
		await migrateArchive();
		expect(writes).toEqual([
			indexKey,
			`snapshots/v2/${revision}/manifest.json`,
		]);
		expect(JSON.parse(stored.get(indexKey)?.body.toString() ?? '')).toEqual({
			schemaVersion: 2,
			registryRevision: revision,
			views: Object.fromEntries(
				manifest.views.map((file) => [file.path, file.sha256]),
			),
		});
		for (const body of bodies)
			expect(stored.get(`api/sha256/${sha256(body)}`)?.body).toEqual(body);
		expect(stored.get('current.json')?.body).toEqual(pointer);
		expect(stored.get(`snapshots/${revision}/manifest.json`)?.body).toEqual(
			Buffer.from(JSON.stringify(manifest)),
		);

		writes.length = 0;
		await migrateArchive();
		expect(writes).toEqual([]);
	}, 15_000);
});
