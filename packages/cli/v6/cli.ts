import { access, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createFontContext } from '@fontsource-utils/core';
import { buildFamily } from './build';
import { writePackage } from './package';
import { loadBuildInputs } from './registry';

async function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		options: {
			inputs: { type: 'string' },
			out: { type: 'string' },
			'registry-url': { type: 'string' },
			revision: { type: 'string' },
		},
	});
	if (!positionals.length || !values.inputs || !values.out) {
		throw new Error(
			'Usage: pnpm v6:build <family...> --inputs <directory> --out <new-directory> [--registry-url <url>] [--revision <sha>]',
		);
	}
	const output = resolve(values.out);
	try {
		await access(output);
		throw new Error(`Output already exists: ${output}`);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
	}
	const inputs = await loadBuildInputs(
		[...new Set(positionals)],
		resolve(values.inputs),
		values['registry-url'],
		values.revision,
	);
	await mkdir(dirname(output), { recursive: true });
	const temporary = await mkdtemp(join(dirname(output), '.v6-build-'));
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
				console.log(
					`${family.id} (${variable ? 'variable' : 'static'}): ${result.fonts.length} fonts`,
				);
			}
		}
		await rename(temporary, output);
		console.log(`Built revision ${inputs.revision} in ${output}`);
	} finally {
		context.destroy();
		await rm(temporary, { recursive: true, force: true });
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
