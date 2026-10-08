import { access, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { createFontContext } from '@fontsource-utils/core';
import { buildFamily } from './family';
import { loadBuildInputs } from './inputs';
import { writePackage } from './package';

export interface PackageBuildOptions {
	inputs: string;
	out: string;
	registryUrl?: string;
	revision?: string;
}

/** Build from one frozen registry snapshot, committing the output only on success. */
export async function buildPackages(
	ids: string[],
	options: PackageBuildOptions,
) {
	if (ids.length === 0) throw new Error('Specify at least one registry family');
	const output = resolve(options.out);
	try {
		await access(output);
		throw new Error(`Output already exists: ${output}`);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
	const inputs = await loadBuildInputs(
		[...new Set(ids)],
		resolve(options.inputs),
		options.registryUrl ?? 'https://api.fontsource.org',
		options.revision,
	);
	await mkdir(dirname(output), { recursive: true });
	const temporary = await mkdtemp(join(dirname(output), '.fontsource-build-'));
	const context = createFontContext();
	try {
		for (const family of inputs.families) {
			for (const variable of [false, true]) {
				if (
					!(variable
						? family.distribution.variable
						: family.distribution.static)
				)
					continue;
				const result = await buildFamily(context, family, inputs, variable);
				await writePackage(
					join(temporary, variable ? 'variable' : 'static', family.id),
					family,
					result,
					variable,
				);
			}
		}
		await rename(temporary, output);
	} finally {
		context.destroy();
		await rm(temporary, { recursive: true, force: true });
	}
}
