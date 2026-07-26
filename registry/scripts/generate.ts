import { join } from 'node:path';
import { consola } from 'consola';
import { openGitSnapshot } from './git.ts';
import { generateGoogle } from './google.ts';
import { generateNam } from './nam.ts';
import {
	familyMetadataSchema,
	type ReplacementRegistry,
	registryIndexSchema,
	replacementRegistrySchema,
	taxonomySchema,
} from './schema.ts';
import {
	compareStrings,
	readJson,
	readJsonIfExists,
	writeJson,
} from './shared.ts';
import { validateRegistry } from './validator.ts';

const logger = consola.withTag('registry');

const applyReplacements = async (
	root: string,
	families: readonly string[],
	replacements: ReplacementRegistry,
): Promise<void> => {
	await Promise.all(
		families.map(async (family) => {
			const path = join(root, 'families', family, 'metadata.json');
			const metadata = familyMetadataSchema.parse(await readJson(path));
			const replacedBy = replacements[metadata.id];
			await writeJson(path, {
				...metadata,
				...(replacedBy ? { status: 'deprecated' } : {}),
				replacedBy,
			});
		}),
	);
};

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
	const previousFamilies = previousIndex?.families ?? [];
	const replacementsValue = await readJsonIfExists(
		join(root, 'replacements.json'),
	);
	const replacements = replacementRegistrySchema.parse(replacementsValue ?? {});
	const previousGoogleIds = previousFamilies
		.filter((family) => family.startsWith('google/'))
		.map((family) => family.slice('google/'.length));
	const taxonomy = taxonomySchema.parse(
		await readJson(join(import.meta.dirname, '..', 'data', 'taxonomy.json')),
	);
	await writeJson(join(root, 'taxonomy.json'), taxonomy);

	logger.start(`Generating families from google/fonts@${google.revision}`);
	const googleFamilies = await generateGoogle(
		google,
		root,
		previousGoogleIds,
		taxonomy,
	);
	logger.success(`Generated ${googleFamilies.length} Google font families`);
	const families = [
		...previousFamilies.filter((family) => !family.startsWith('google/')),
		...googleFamilies.map((family) => `google/${family}`),
	].toSorted(compareStrings);

	logger.start(`Generating subsets from googlefonts/nam-files@${nam.revision}`);
	const subsets = await generateNam(nam, root);
	logger.success(`Generated ${subsets.length} subsets`);

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
	await writeJson(join(root, 'replacements.json'), replacements);
	await applyReplacements(root, families, replacements);
	logger.start('Validating registry');
	await validateRegistry(root);
	logger.success('Registry is valid');
};

if (import.meta.main) {
	const [googleRepository, googleRevision, namRepository, namRevision] =
		process.argv.slice(2);
	if (
		!googleRepository ||
		!googleRevision ||
		!namRepository ||
		!namRevision ||
		process.argv.length !== 6
	) {
		throw new Error(
			'Usage: generate.ts <google-fonts-repo> <google-commit> <nam-files-repo> <nam-commit>',
		);
	}
	await generateRegistry(
		googleRepository,
		googleRevision,
		namRepository,
		namRevision,
		join(import.meta.dirname, '..', 'data'),
	);
}
