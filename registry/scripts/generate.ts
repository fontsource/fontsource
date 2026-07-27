import { join } from 'node:path';
import { consola } from 'consola';
import { generateFontFiles } from './font-files.ts';
import { openGitSnapshot } from './git.ts';
import { generateGoogle } from './google.ts';
import { generateGoogleIcons } from './google-icons.ts';
import { generateNam } from './nam.ts';
import {
	familyMetadataSchema,
	languageCatalogSchema,
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

export const applyReplacements = async (
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
	googleIconsRepository: string,
	googleIconsRevision: string,
	namRepository: string,
	namRevision: string,
	fontFilesRepository: string,
	fontFilesRevision: string,
	root: string,
): Promise<void> => {
	const google = openGitSnapshot(googleRepository, googleRevision);
	const googleIcons = openGitSnapshot(
		googleIconsRepository,
		googleIconsRevision,
		['LICENSE', 'font', 'variablefont'],
	);
	const nam = openGitSnapshot(namRepository, namRevision);
	const fontFiles = openGitSnapshot(fontFilesRepository, fontFilesRevision);
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
	const previousGoogleIconIds = previousFamilies
		.filter((family) => family.startsWith('google-icons/'))
		.map((family) => family.slice('google-icons/'.length));
	const previousFontsourceIds = previousFamilies
		.filter((family) => family.startsWith('fontsource/'))
		.map((family) => family.slice('fontsource/'.length));
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
	logger.start(
		`Generating families from google/material-design-icons@${googleIcons.revision}`,
	);
	const googleIconFamilies = await generateGoogleIcons(
		googleIcons,
		root,
		previousGoogleIconIds,
	);
	logger.success(`Generated ${googleIconFamilies.length} Google icon families`);
	const languages = languageCatalogSchema.parse(
		await readJson(join(root, 'languages.json')),
	);
	logger.start(
		`Generating families from fontsource/font-files@${fontFiles.revision}`,
	);
	const fontsourceFamilies = await generateFontFiles(
		fontFiles,
		root,
		previousFontsourceIds,
		languages,
	);
	logger.success(
		`Generated ${fontsourceFamilies.length} Fontsource font families`,
	);

	const families = [
		...googleFamilies.map((family) => `google/${family}`),
		...googleIconFamilies.map((family) => `google-icons/${family}`),
		...fontsourceFamilies.map((family) => `fontsource/${family}`),
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
			googleIcons: {
				repository: 'google/material-design-icons',
				revision: googleIcons.revision,
			},
			namFiles: {
				repository: 'googlefonts/nam-files',
				revision: nam.revision,
			},
			fontFiles: {
				repository: 'fontsource/font-files',
				revision: fontFiles.revision,
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
	const [
		googleRepository,
		googleRevision,
		googleIconsRepository,
		googleIconsRevision,
		namRepository,
		namRevision,
		fontFilesRepository,
		fontFilesRevision,
	] = process.argv.slice(2);
	if (
		!googleRepository ||
		!googleRevision ||
		!googleIconsRepository ||
		!googleIconsRevision ||
		!namRepository ||
		!namRevision ||
		!fontFilesRepository ||
		!fontFilesRevision ||
		process.argv.length !== 10
	) {
		throw new Error(
			'Usage: generate.ts <google-fonts-repo> <google-commit> <google-icons-repo> <google-icons-commit> <nam-files-repo> <nam-commit> <font-files-repo> <font-files-commit>',
		);
	}
	await generateRegistry(
		googleRepository,
		googleRevision,
		googleIconsRepository,
		googleIconsRevision,
		namRepository,
		namRevision,
		fontFilesRepository,
		fontFilesRevision,
		join(import.meta.dirname, '..', 'data'),
	);
}
