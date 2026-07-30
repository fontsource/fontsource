import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { consola } from 'consola';
import { generateFontFiles } from './font-files.ts';
import { applyReplacements } from './generate.ts';
import { assertGitPathClean, getGitRevision, openGitSnapshot } from './git.ts';
import {
	languageCatalogSchema,
	replacementRegistrySchema,
	upstreamsSchema,
} from './schema.ts';
import { readJson, writeJson } from './shared.ts';
import { listFamilyKeys, validateRegistry } from './validator.ts';

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
	const upstreams = upstreamsSchema.parse(
		await readJson(join(root, 'upstreams.json')),
	);
	const languages = languageCatalogSchema.parse(
		await readJson(join(root, 'languages.json')),
	);
	const replacements = replacementRegistrySchema.parse(
		await readJson(join(root, 'replacements.json')),
	);
	const familyKeys = await listFamilyKeys(root);
	const previousFamilyIds = familyKeys
		.filter((family) => family.startsWith('fontsource/'))
		.map((family) => family.slice('fontsource/'.length));

	logger.start(`Checking fontsource/font-files@${revision}`);
	const familyIds = await generateFontFiles(
		snapshot,
		root,
		previousFamilyIds,
		languages,
	);
	await writeJson(join(root, 'upstreams.json'), {
		...upstreams,
		fontFiles: {
			repository: 'fontsource/font-files',
			revision,
		},
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
