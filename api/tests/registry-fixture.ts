import { REGISTRY_SNAPSHOT_PREFIX } from '../shared/registry-archive';
import { testEnv } from './helpers';

export const seedRegistryViews = async (
	views: ReadonlyArray<{ path: string; body: unknown }>,
) => {
	const registryRevision = crypto
		.randomUUID()
		.replaceAll('-', '')
		.padEnd(40, '0');
	const entries = await Promise.all(
		views.map(async ({ path, body }) => {
			const content = JSON.stringify(body);
			const digest = await crypto.subtle.digest(
				'SHA-256',
				new TextEncoder().encode(content),
			);
			const hash = Array.from(new Uint8Array(digest), (byte) =>
				byte.toString(16).padStart(2, '0'),
			).join('');
			await testEnv.REGISTRY.put(`api/sha256/${hash}`, content);
			return [path, hash] as const;
		}),
	);
	const index = {
		schemaVersion: 2,
		registryRevision,
		views: Object.fromEntries(entries),
	};
	await testEnv.REGISTRY.put(
		`${REGISTRY_SNAPSHOT_PREFIX}/${registryRevision}/index.json`,
		JSON.stringify(index),
	);
	await testEnv.REGISTRY.put(
		'current.json',
		JSON.stringify({ schemaVersion: 1, registryRevision }),
	);
	return index;
};
