import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import {
	type RegistryFamilyDetail,
	RegistryFamilyDetailSchema,
	RegistryIdParamSchema,
	RegistrySubsetSchema,
} from '../../../../api/shared/registry';

type Subset = ReturnType<typeof RegistrySubsetSchema.parse>;

const SnapshotSchema = z.object({
	revision: z.string().regex(/^[0-9a-f]{40}$/),
	families: z.array(RegistryFamilyDetailSchema),
	subsets: z.record(z.string(), RegistrySubsetSchema),
});

export interface BuildInputs {
	families: RegistryFamilyDetail[];
	subsets: Record<string, Subset>;
	sources: Map<string, Uint8Array>;
}

const referencedSources = (family: RegistryFamilyDetail) => {
	const hashes = new Set(
		[
			...(family.distribution.static ?? []),
			...(family.distribution.variable ?? []),
		].map((target) => target.source),
	);
	return [...hashes].map((hash) => {
		const source = family.sources.find((source) => source.sha256 === hash);
		if (!source) throw new Error(`${family.id}: missing source ${hash}`);
		return source;
	});
};

/** Freeze metadata at one revision and verify the exact source bytes on every build. */
export async function loadBuildInputs(
	ids: string[],
	directory: string,
	registryUrl: string,
	requestedRevision?: string,
): Promise<BuildInputs> {
	for (const id of ids) RegistryIdParamSchema.parse({ id });
	let revision = requestedRevision;
	let families: RegistryFamilyDetail[] = [];
	let subsets: Record<string, Subset> = {};
	let frozen: string | undefined;
	try {
		frozen = await readFile(join(directory, 'snapshot.json'), 'utf8');
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}

	const request = async (path: string, metadata: boolean) => {
		const url = new URL(path, registryUrl);
		if (metadata && revision) url.searchParams.set('revision', revision);
		const response = await fetch(url);
		if (!response.ok)
			throw new Error(`${url}: ${response.status} ${response.statusText}`);
		if (metadata) {
			const resolved = response.headers.get('X-Registry-Revision');
			if (
				!resolved ||
				!/^[0-9a-f]{40}$/.test(resolved) ||
				(revision && resolved !== revision)
			) {
				throw new Error(`${url}: missing or mismatched registry revision`);
			}
			revision = resolved;
		}
		return response;
	};

	if (frozen) {
		const snapshot = SnapshotSchema.parse(JSON.parse(frozen));
		if (revision && revision !== snapshot.revision)
			throw new Error('Frozen inputs use a different revision');
		revision = snapshot.revision;
		families = snapshot.families;
		subsets = snapshot.subsets;
		families = ids.map((id) => {
			const family = families.find((family) => family.id === id);
			if (!family)
				throw new Error(
					`${id} is not in the frozen inputs; use a new --inputs directory`,
				);
			return family;
		});
	} else {
		for (const id of ids) {
			const family = RegistryFamilyDetailSchema.parse(
				await (await request(`/v1/registry/families/${id}`, true)).json(),
			);
			if (family.id !== id)
				throw new Error(`Registry returned ${family.id} for ${id}`);
			families.push(family);
			const characters = family.distribution.characters;
			if (characters.type === 'all') continue;
			const definitions = new Set(
				characters.subsets.map((subset) => subset.definition),
			);
			if (characters.slicing) definitions.add(characters.slicing);
			for (const definition of definitions) {
				if (subsets[definition]) continue;
				const subset = RegistrySubsetSchema.parse(
					await (
						await request(`/v1/registry/subsets/${definition}`, true)
					).json(),
				);
				if (subset.id !== definition)
					throw new Error(`Registry returned ${subset.id} for ${definition}`);
				subsets[definition] = subset;
			}
		}
	}
	if (!revision || !/^[0-9a-f]{40}$/.test(revision))
		throw new Error('Invalid registry revision');

	const sources = new Map<string, Uint8Array>();
	for (const family of families) {
		for (const source of referencedSources(family)) {
			if (sources.has(source.sha256)) continue;
			const bytes = frozen
				? await readFile(join(directory, 'sources', source.sha256))
				: new Uint8Array(
						await (await request(source.downloadUrl, false)).arrayBuffer(),
					);
			if (
				bytes.byteLength !== source.size ||
				createHash('sha256').update(bytes).digest('hex') !== source.sha256
			) {
				throw new Error(
					`${family.id}: source integrity mismatch for ${source.sha256}`,
				);
			}
			sources.set(source.sha256, bytes);
		}
	}
	if (!frozen) {
		await mkdir(join(directory, 'sources'), { recursive: true });
		for (const [hash, bytes] of sources)
			await writeFile(join(directory, 'sources', hash), bytes);
		// A complete snapshot is committed last; interrupted downloads are never replayed.
		await writeFile(
			join(directory, 'snapshot.json'),
			`${JSON.stringify({ revision, families, subsets }, null, 2)}\n`,
			{ flag: 'wx' },
		);
	}
	return { families, subsets, sources };
}
