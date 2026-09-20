import type { z } from 'zod';
import {
	REGISTRY_SNAPSHOT_PREFIX,
	type RegistrySnapshotIndexSchema,
} from '../../api/shared/registry-archive.ts';
import { putObject } from './r2.ts';
import type { archiveManifestSchema } from './schema.ts';
import { canonicalJson, sha256 } from './shared.ts';

// Shared by normal publication and the one-time migration; neither advances current.json.
export const writeSnapshot = async (
	manifest: z.infer<typeof archiveManifestSchema>,
): Promise<void> => {
	const index: z.infer<typeof RegistrySnapshotIndexSchema> = {
		schemaVersion: 2,
		registryRevision: manifest.registryRevision,
		views: Object.fromEntries(
			manifest.views.map(({ path, sha256 }) => [path, sha256]),
		),
	};
	for (const [name, value] of [
		['index', index],
		['manifest', manifest],
	] as const) {
		const bytes = Buffer.from(canonicalJson(value));
		await putObject({
			key: `${REGISTRY_SNAPSHOT_PREFIX}/${manifest.registryRevision}/${name}.json`,
			size: bytes.byteLength,
			sha256: sha256(bytes),
			contentType: 'application/json',
			read: async () => bytes,
		});
	}
};
