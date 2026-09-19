import { consola } from 'consola';
import fastq from 'fastq';
import { z } from 'zod';
import { CurrentRegistrySnapshotSchema } from '../../api/shared/registry-archive.ts';
import { writeSnapshot } from './archive-snapshot.ts';
import { getObject, putObject } from './r2.ts';
import { archiveManifestSchema } from './schema.ts';

// One-time cutover: retain the legacy snapshot and pointer for the running API.
export const migrateArchive = async (): Promise<void> => {
	const pointer = await getObject('current.json');
	if (!pointer) throw new Error('No current registry snapshot to migrate');
	const current = CurrentRegistrySnapshotSchema.parse(
		JSON.parse(Buffer.from(pointer).toString('utf8')),
	);
	const bytes = await getObject(
		`snapshots/${current.registryRevision}/manifest.json`,
	);
	if (!bytes) throw new Error('Current legacy snapshot manifest is missing');
	const legacy = archiveManifestSchema
		.extend({ schemaVersion: z.literal(1) })
		.parse(JSON.parse(Buffer.from(bytes).toString('utf8')));
	if (legacy.registryRevision !== current.registryRevision)
		throw new Error('Legacy manifest revision does not match current snapshot');
	const uploads = fastq.promise(async (file: (typeof legacy.views)[number]) => {
		await putObject({
			key: `api/sha256/${file.sha256}`,
			size: file.size,
			sha256: file.sha256,
			contentType: 'application/json',
			read: async () => {
				const body = await getObject(
					`snapshots/${current.registryRevision}/api/${file.path}`,
				);
				if (!body) throw new Error(`Legacy view is missing: ${file.path}`);
				return body;
			},
		});
	}, 8);
	const results = await Promise.allSettled(
		[...new Map(legacy.views.map((file) => [file.sha256, file])).values()].map(
			(file) => uploads.push(file),
		),
	);
	const failure = results.find((result) => result.status === 'rejected');
	if (failure?.status === 'rejected') throw failure.reason;
	await writeSnapshot({ ...legacy, schemaVersion: 2 });
	const latest = await getObject('current.json');
	if (!latest || !Buffer.from(latest).equals(Buffer.from(pointer))) {
		throw new Error(
			'Current snapshot changed during migration. Pause archive runs and migrate again before deploying the reader.',
		);
	}
	consola.success(
		`Prepared snapshot ${current.registryRevision}; current.json and legacy objects are unchanged`,
	);
};

if (import.meta.main) await migrateArchive();
