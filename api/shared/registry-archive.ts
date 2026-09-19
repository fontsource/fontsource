import { z } from 'zod';

const revisionSchema = z.string().regex(/^[0-9a-f]{40}$/);

export const REGISTRY_SNAPSHOT_PREFIX = 'snapshots/v2';

export const CurrentRegistrySnapshotSchema = z.strictObject({
	schemaVersion: z.literal(1),
	registryRevision: revisionSchema,
});

export const RegistrySnapshotIndexSchema = z.strictObject({
	schemaVersion: z.literal(2),
	registryRevision: revisionSchema,
	views: z.record(z.string(), z.string().regex(/^[0-9a-f]{64}$/)),
});
