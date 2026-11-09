import { createHash } from 'node:crypto';
import { access, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { z } from 'zod';
import { PreparedArtifactSchema } from '../../../../api/shared/prepared-artifacts';
import { RegistryIdParamSchema } from '../../../../api/shared/registry';
import { writePackage } from './package';

export interface DownloadOptions {
	out: string;
	registryUrl?: string;
}

/** Assemble published-shape packages without initializing the font processor. */
export async function downloadPackages(
	ids: string[],
	options: DownloadOptions,
) {
	const families = z.array(RegistryIdParamSchema.shape.id).min(1).parse(ids);
	const origin = new URL(options.registryUrl ?? 'https://api.fontsource.org');
	const output = resolve(options.out);
	try {
		await access(output);
		throw new Error(`Output already exists: ${output}`);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
	await mkdir(dirname(output), { recursive: true });
	const temporary = await mkdtemp(
		join(dirname(output), '.fontsource-download-'),
	);
	try {
		for (const id of new Set(families)) {
			const found = new Set<string>();
			const expected = new Set<string>();
			let pinned: string | undefined;
			for (const kind of ['static', 'variable'] as const) {
				const url = new URL(
					`/v1/registry/families/${id}/artifacts/${kind}`,
					origin,
				);
				if (pinned) url.searchParams.set('artifact', pinned);
				const response = await fetch(url);
				if (response.status === 404) continue;
				if (!response.ok)
					throw new Error(
						`${id}/${kind}: artifact request failed (${response.status})`,
					);
				const artifact = PreparedArtifactSchema.parse(await response.json());
				if (artifact.id !== id || artifact.kind !== kind)
					throw new Error(`${id}/${kind}: artifact identity mismatch`);
				if (pinned && artifact.artifact !== pinned)
					throw new Error(`${id}: package kinds use different source builds`);
				pinned = artifact.artifact;
				found.add(kind);
				for (const candidate of ['static', 'variable'] as const)
					if (artifact.metadata.distribution[candidate]?.length)
						expected.add(candidate);
				const fonts = [];
				const css = [];
				for (const file of artifact.files) {
					const url = new URL(file.url, origin);
					if (url.origin !== origin.origin)
						throw new Error('Artifact URL must use the registry origin');
					const asset = await fetch(url);
					if (!asset.ok)
						throw new Error(`${file.path}: download failed (${asset.status})`);
					const bytes = new Uint8Array(await asset.arrayBuffer());
					if (
						bytes.byteLength !== file.size ||
						createHash('sha256').update(bytes).digest('hex') !== file.sha256
					)
						throw new Error(`${file.path}: artifact integrity mismatch`);
					if (file.path.endsWith('.woff2'))
						fonts.push({
							filename: file.path,
							format: 'woff2' as const,
							content: bytes,
						});
					else
						css.push({
							filename: file.path,
							content: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
						});
				}
				await writePackage(
					join(temporary, kind, id),
					artifact.metadata,
					{
						fonts,
						css,
						faces: artifact.manifest.faces,
						entrypoints: artifact.manifest.entrypoints,
					},
					kind === 'variable',
				);
			}
			if (!found.size)
				throw new Error(`${id}: no completed artifacts are available`);
			if ([...expected].some((kind) => !found.has(kind)))
				throw new Error(
					`${id}: missing completed artifacts for a declared package kind`,
				);
		}
		await rename(temporary, output);
	} finally {
		await rm(temporary, { recursive: true, force: true });
	}
}
