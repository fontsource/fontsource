import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { consola } from 'consola';
import { generateFontFiles } from './font-files.ts';
import { applyReplacements } from './generate.ts';
import { assertGitPathClean, getGitRevision, openGitSnapshot } from './git.ts';
import {
	languageCatalogSchema,
	registryIndexSchema,
	replacementRegistrySchema,
} from './schema.ts';
import { compareStrings, readJson, writeJson } from './shared.ts';
import { validateRegistry } from './validator.ts';

const logger = consola.withTag('registry');

const [repository] = process.argv.slice(2);
if (!repository || process.argv.length !== 3) {
	throw new Error('Usage: check-font-files.ts <font-files-repo>');
}

assertGitPathClean(repository, 'sources');
const revision = getGitRevision(repository);
const snapshot = openGitSnapshot(repository, revision);
const temporary = await mkdtemp(join(tmpdir(), 'fontsource-registry-'));
const root = join(temporary, 'data');

try {
	await cp(join(import.meta.dirname, '..', 'data'), root, { recursive: true });
	const index = registryIndexSchema.parse(
		await readJson(join(root, 'index.json')),
	);
	const languages = languageCatalogSchema.parse(
		await readJson(join(root, 'languages.json')),
	);
	const replacements = replacementRegistrySchema.parse(
		await readJson(join(root, 'replacements.json')),
	);
	const previousFamilyIds = index.families
		.filter((family) => family.startsWith('fontsource/'))
		.map((family) => family.slice('fontsource/'.length));

	logger.start(`Checking fontsource/font-files@${revision}`);
	const familyIds = await generateFontFiles(
		snapshot,
		root,
		previousFamilyIds,
		languages,
	);
	const families = [
		...index.families.filter((family) => !family.startsWith('fontsource/')),
		...familyIds.map((family) => `fontsource/${family}`),
	].toSorted(compareStrings);
	await writeJson(join(root, 'index.json'), {
		...index,
		upstreams: {
			...index.upstreams,
			fontFiles: {
				repository: 'fontsource/font-files',
				revision,
			},
		},
		families,
	});
	await applyReplacements(
		root,
		familyIds.map((family) => `fontsource/${family}`),
		replacements,
	);
	await validateRegistry(root);
	logger.success(`Checked ${familyIds.length} Fontsource font families`);
} finally {
	await rm(temporary, { recursive: true, force: true });
}
