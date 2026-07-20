import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

const r2 = vi.hoisted(() => ({
	objectMatches: vi.fn(),
	putObject: vi.fn(),
}));

vi.mock('./r2.ts', () => r2);

import { publishArchive } from './archive.ts';
import { archiveManifestSchema } from './schema.ts';

const REGISTRY_ROOT = resolve(import.meta.dirname, '../data');
const REVISION = 'a'.repeat(40);

describe('registry source archive', () => {
	it('rejects non-commit snapshot revisions', () => {
		expect(() =>
			archiveManifestSchema.parse({
				schemaVersion: 1,
				registryRevision: 'latest',
				registry: [],
				sources: [],
			}),
		).toThrow();
	});

	it('publishes content-addressed objects before the snapshot manifest', async () => {
		const keys: string[] = [];
		let manifest: unknown;
		r2.objectMatches.mockResolvedValue(false);
		r2.putObject.mockImplementation(
			async (object: { key: string; read: () => Promise<Uint8Array> }) => {
				keys.push(object.key);
				if (object.key.startsWith('snapshots/')) {
					manifest = JSON.parse(
						Buffer.from(await object.read()).toString('utf8'),
					);
				}
			},
		);

		await publishArchive(REGISTRY_ROOT, REVISION);

		expect(keys.at(-1)).toBe(`snapshots/${REVISION}/manifest.json`);
		expect(keys.some((key) => key.startsWith('registry/sha256/'))).toBe(true);
		expect(keys.some((key) => key.startsWith('sources/sha256/'))).toBe(true);
		expect(manifest).toMatchObject({
			schemaVersion: 1,
			registryRevision: REVISION,
			registry: expect.arrayContaining([
				expect.objectContaining({ path: 'index.json' }),
			]),
			sources: expect.arrayContaining([
				expect.objectContaining({
					sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
				}),
			]),
		});
	}, 15_000);
});
