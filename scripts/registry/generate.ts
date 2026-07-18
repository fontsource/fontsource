import { join } from 'node:path';
import { openGitSnapshot } from './git.ts';
import { generateGoogle } from './google.ts';
import { generateNam } from './nam.ts';
import { registryIndexSchema } from './schema.ts';
import { isMain, readJsonIfExists, writeJson } from './shared.ts';
import { validateRegistry } from './validator.ts';

export const generateRegistry = async (
	googleRepository: string,
	googleRevision: string,
	namRepository: string,
	namRevision: string,
	root: string,
): Promise<void> => {
	const google = openGitSnapshot(googleRepository, googleRevision);
	const nam = openGitSnapshot(namRepository, namRevision);
	const previousValue = await readJsonIfExists(join(root, 'index.json'));
	const previousIndex =
		previousValue === null ? null : registryIndexSchema.parse(previousValue);
	const families = await generateGoogle(
		google,
		root,
		previousIndex?.families ?? [],
	);
	const subsets = await generateNam(nam, root);

	await writeJson(join(root, 'index.json'), {
		schemaVersion: 1,
		upstreams: {
			googleFonts: {
				repository: 'google/fonts',
				revision: google.revision,
			},
			namFiles: {
				repository: 'googlefonts/nam-files',
				revision: nam.revision,
			},
		},
		families,
		subsets,
	});
	await validateRegistry(root);
};

if (isMain(import.meta.url)) {
	const [
		googleRepository,
		googleRevision,
		namRepository,
		namRevision,
		registryRoot,
	] = process.argv.slice(2);
	if (
		!googleRepository ||
		!googleRevision ||
		!namRepository ||
		!namRevision ||
		!registryRoot ||
		process.argv.length !== 7
	) {
		throw new Error(
			'Usage: generate.ts <google-fonts-repo> <google-commit> <nam-files-repo> <nam-commit> <registry-dir>',
		);
	}
	await generateRegistry(
		googleRepository,
		googleRevision,
		namRepository,
		namRevision,
		registryRoot,
	);
}
