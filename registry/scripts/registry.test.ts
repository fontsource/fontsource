import { execFileSync } from 'node:child_process';
import {
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { describe, expect, it, onTestFinished } from 'vitest';
import { generateFontFiles } from './font-files.ts';
import { generateRegistry } from './generate.ts';
import { assertGitPathClean, openGitSnapshot } from './git.ts';
import {
	familyMetadataSchema,
	languageCatalogSchema,
	registryIndexSchema,
	sourceFamilySchema,
} from './schema.ts';
import { canonicalJson, compareStrings, readJson, sha256 } from './shared.ts';
import { validateRegistry } from './validator.ts';

const ABEL_POLICY = {
	packages: {
		static: { variants: [{ weight: 400, style: 'normal' }] },
	},
	defaultSubset: 'latin',
	subsets: [{ id: 'latin', definition: 'latin' }],
} as const;

const TEST_LANGUAGES = languageCatalogSchema.parse({
	en_Latn: {
		language: 'en',
		script: 'Latn',
		name: 'English',
		requiredCodepoints: [65, 66, 67],
	},
});

const temporaryDirectory = async (name: string): Promise<string> => {
	const path = await mkdtemp(join(tmpdir(), `${name}-`));
	onTestFinished(() => rm(path, { recursive: true, force: true }));
	return path;
};

const writeFixture = async (
	root: string,
	path: string,
	contents: string,
): Promise<void> => {
	const output = join(root, path);
	await mkdir(dirname(output), { recursive: true });
	await writeFile(output, contents);
};

const runGit = (repository: string, args: string[]): string =>
	execFileSync('git', ['-C', repository, ...args], {
		env: {
			...process.env,
			GIT_AUTHOR_DATE: '2026-01-02T00:00:00Z',
			GIT_COMMITTER_DATE: '2026-01-02T00:00:00Z',
		},
	})
		.toString('utf8')
		.trim();

const commitAll = (repository: string, message: string): string => {
	runGit(repository, ['add', '.']);
	runGit(repository, ['commit', '-q', '-m', message]);
	return runGit(repository, ['rev-parse', 'HEAD']);
};

const createGitRepository = async (name: string): Promise<string> => {
	const repository = await temporaryDirectory(name);
	runGit(repository, ['init', '-q', '--initial-branch=main']);
	runGit(repository, ['config', 'user.name', 'Registry Tests']);
	runGit(repository, ['config', 'user.email', 'registry@example.com']);
	return repository;
};

const copyFont = async (
	repository: string,
	fixture: string,
	path: string,
): Promise<void> => {
	const output = join(repository, path);
	await mkdir(dirname(output), { recursive: true });
	await cp(
		resolve(
			import.meta.dirname,
			'../../packages/core/tests/fixtures/fonts',
			fixture,
		),
		output,
	);
};

const treeHashes = async (root: string): Promise<Record<string, string>> => {
	const entries = await readdir(root, { recursive: true, withFileTypes: true });
	const hashes = await Promise.all(
		entries
			.filter((entry) => !entry.isDirectory())
			.map(async (entry) => {
				const path = join(entry.parentPath, entry.name);
				return [relative(root, path), sha256(await readFile(path))] as const;
			}),
	);
	return Object.fromEntries(
		hashes.toSorted(([left], [right]) => compareStrings(left, right)),
	);
};

const createGoogleRepository = async (): Promise<{
	repository: string;
	revision: string;
}> => {
	const repository = await createGitRepository('google-fonts');
	await copyFont(
		repository,
		'abel-latin-400-normal.ttf',
		'ofl/abel/Abel-Regular.ttf',
	);
	await copyFont(
		repository,
		'recursive-latin-full-normal.ttf',
		'ofl/recursive/Recursive.ttf',
	);
	await copyFont(
		repository,
		'abel-latin-400-normal.ttf',
		'ofl/stalesans/StaleSans-Regular.ttf',
	);
	await writeFixture(
		repository,
		'ofl/abel/METADATA.pb',
		`name: "Abel"
designer: "MADType"
license: "OFL"
category: "SANS_SERIF"
date_added: "2011-08-03"
fonts {
  name: "Abel"
  style: "normal"
  weight: 400
  filename: "Abel-Regular.ttf"
  post_script_name: "Abel-Regular"
  full_name: "Abel Regular"
  copyright: "Copyright Abel"
}
subsets: "latin"
subsets: "menu"
primary_script: "Latn"
primary_language: "en_Latn"
sample_text {
  styles: "All people are born free"
  tester: "All people are born free and equal"
}
`,
	);
	await writeFixture(
		repository,
		'ofl/recursive/METADATA.pb',
		`name: "Recursive Sans"
designer: "Arrow Type"
license: "OFL"
category: "SANS_SERIF"
date_added: "2020-01-01"
stroke: "SANS_SERIF"
classifications: "DISPLAY"
fonts {
  name: "Recursive"
  style: "normal"
  weight: 400
  filename: "Recursive.ttf"
  post_script_name: "Recursive"
  full_name: "Recursive"
  copyright: "Copyright Recursive"
}
subsets: "latin"
`,
	);
	await writeFixture(
		repository,
		'ofl/stalesans/METADATA.pb',
		`name: "Stale Sans"
designer: "Registry Tests"
license: "OFL"
category: "SANS_SERIF"
date_added: "2026-01-01"
fonts {
  name: "Stale Sans"
  style: "normal"
  weight: 400
  filename: "StaleSans-Regular.ttf"
  post_script_name: "StaleSans-Regular"
  full_name: "Stale Sans Regular"
}
subsets: "latin"
`,
	);
	for (const id of ['abel', 'recursive', 'stalesans']) {
		await writeFixture(repository, `ofl/${id}/OFL.txt`, `License for ${id}\n`);
	}
	await writeFixture(
		repository,
		'tags/all/families.csv',
		`Abel,,/Expressive/Active,10
Abel,,/Expressive/Business,75
Abel,,/Quality/Drawing,90
Abel,"wdth,wght@75,400",/Theme/Stencil,100
Recursive Sans,,/Sans/Humanist,50
`,
	);
	await writeFixture(
		repository,
		'ofl/abel/DESCRIPTION.en_us.html',
		'<h1>Abel</h1><script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="https://example.com/info">safe</a>',
	);
	await writeFixture(
		repository,
		'axisregistry/Lib/axisregistry/data/weight.textproto',
		`tag: "wght"
display_name: "Weight"
min_value: 1
default_value: 400
max_value: 1000
precision: 0
description: "Weight " "axis"
fallback { name: "Regular" value: 400 }
fallback_only: false
`,
	);
	await writeFixture(
		repository,
		'lang/Lib/gflanguages/data/languages/en_Latn.textproto',
		`id: "en_Latn"
language: "en"
script: "Latn"
name: "English"
autonym: "English"
exemplar_chars {
  base: "A {BC} 𐌀"
  not_required: "𐌀"
}
sample_text {
  styles: "All people are born free"
  tester: "All people are born free and equal"
}
`,
	);
	await writeFixture(
		repository,
		'lang/Lib/gflanguages/data/languages/zy_Latn.textproto',
		`id: "zy_Latn"
language: "zy"
script: "Latn"
name: "Sample-only test language"
sample_text {
  styles: "A 🫠."
}
`,
	);
	await writeFixture(
		repository,
		'lang/Lib/gflanguages/data/languages/zz_Latn.textproto',
		`id: "zz_Latn"
language: "zz"
script: "Latn"
name: "Normalization test language"
exemplar_chars {
  base: "{Å} 🫠"
}
`,
	);
	return {
		repository,
		revision: commitAll(repository, 'initial Google snapshot'),
	};
};

const createNamRepository = async (): Promise<{
	repository: string;
	revision: string;
}> => {
	const repository = await createGitRepository('nam-files');
	await writeFixture(
		repository,
		'Lib/gfsubsets/data/latin_unique-glyphs.nam',
		'0x0020 SPACE\n0x0021 EXCLAMATION\n0x0022 QUOTATION MARK\n',
	);
	await writeFixture(
		repository,
		'slices/japanese_default.txt',
		'subsets { codepoints: 66 }\nsubsets { codepoints: 65 }\n',
	);
	return {
		repository,
		revision: commitAll(repository, 'initial NAM snapshot'),
	};
};

const createFontFilesRepository = async (): Promise<{
	repository: string;
	revision: string;
}> => {
	const repository = await createGitRepository('font-files');
	await copyFont(
		repository,
		'abel-latin-400-normal.ttf',
		'sources/example/files/Example-Regular.ttf',
	);
	await writeFixture(
		repository,
		'sources/example/metadata.json',
		canonicalJson({
			id: 'example',
			family: 'Example',
			classifications: ['display', 'sans-serif'],
			tags: ['theme/stencil'],
			designer: 'Registry Tests',
			dateAdded: '2026-01-02',
			license: {
				id: 'OFL-1.1',
				url: 'https://openfontlicense.org/open-font-license-official-text/',
			},
			declaredSubsets: ['latin'],
			sourceFiles: [
				{
					path: 'files/Example-Regular.ttf',
					variant: { weight: 400, style: 'normal' },
				},
			],
		}),
	);
	await writeFixture(
		repository,
		'sources/example/license.txt',
		'Example license\n',
	);
	await writeFixture(
		repository,
		'sources/example/description.en-US.md',
		'# Example\n',
	);
	return {
		repository,
		revision: commitAll(repository, 'initial Fontsource snapshot'),
	};
};

const addRetainedRegistryState = async (root: string): Promise<void> => {
	await writeFixture(
		root,
		'families/google/abel/policy.json',
		canonicalJson(ABEL_POLICY),
	);
	const googleDirectory = join(root, 'families/google/abel');
	const fontsourceDirectory = join(root, 'families/fontsource/example');
	const metadata = familyMetadataSchema.parse(
		await readJson(join(googleDirectory, 'metadata.json')),
	);
	await writeFixture(
		root,
		'families/fontsource/example/metadata.json',
		canonicalJson({
			...metadata,
			id: 'example',
			family: 'Example',
			provider: 'fontsource',
			provenance: { type: 'registry' },
		}),
	);
	await cp(
		join(googleDirectory, 'inspection.json'),
		join(fontsourceDirectory, 'inspection.json'),
	);
	const index = registryIndexSchema.parse(
		await readJson(join(root, 'index.json')),
	);
	await writeFixture(
		root,
		'index.json',
		canonicalJson({
			...index,
			families: [...index.families, 'fontsource/example'].toSorted(
				compareStrings,
			),
		}),
	);
};

describe('registry ingestion', () => {
	it('archives only committed registry data', async () => {
		const repository = await createGitRepository('committed-registry');
		await writeFixture(repository, 'registry/data/index.json', '{}\n');
		commitAll(repository, 'registry snapshot');
		expect(() => assertGitPathClean(repository, 'registry/data')).not.toThrow();

		await writeFixture(repository, 'registry/data/untracked.json', '{}\n');
		expect(() => assertGitPathClean(repository, 'registry/data')).toThrow(
			'must match HEAD',
		);
	});

	it('rejects shallow repositories that cannot prove source history', async () => {
		const source = await createGitRepository('source-history');
		await writeFixture(source, 'family/METADATA.pb', 'name: "Example"\n');
		const revision = commitAll(source, 'source history');
		const shallow = await temporaryDirectory('shallow-repository');
		execFileSync('git', [
			'clone',
			'-q',
			'--depth=1',
			`file://${source}`,
			shallow,
		]);

		expect(() => openGitSnapshot(shallow, revision)).toThrow(
			'complete Git history',
		);
	});

	it('rejects public family IDs shared by multiple providers', async () => {
		const registry = await temporaryDirectory('duplicate-family-id');
		await writeFixture(
			registry,
			'index.json',
			canonicalJson({
				schemaVersion: 1,
				upstreams: {
					googleFonts: {
						repository: 'google/fonts',
						revision: '1'.repeat(40),
					},
					namFiles: {
						repository: 'googlefonts/nam-files',
						revision: '2'.repeat(40),
					},
				},
				families: ['fontsource/abel', 'google/abel'],
				subsets: [],
			}),
		);

		await expect(validateRegistry(registry)).rejects.toThrow(
			'Duplicate registry family ID abel',
		);
	});

	it('ingests a Fontsource source family', async () => {
		const source = await createFontFilesRepository();
		const registry = await temporaryDirectory('font-files-registry');
		const snapshot = openGitSnapshot(source.repository, source.revision);

		await expect(
			generateFontFiles(snapshot, registry, TEST_LANGUAGES),
		).resolves.toEqual(['example']);
		expect(
			await readJson(
				join(registry, 'families/fontsource/example/metadata.json'),
			),
		).toMatchObject({
			provider: 'fontsource',
			status: 'active',
			classifications: ['display', 'sans-serif'],
			tags: ['theme/stencil'],
			languages: ['en_Latn'],
			provenance: {
				type: 'github',
				repository: 'fontsource/font-files',
				revision: source.revision,
				directory: 'sources/example',
			},
			sourceFiles: [
				{
					path: 'sources/example/files/Example-Regular.ttf',
					variant: { weight: 400, style: 'normal' },
				},
			],
		});
		expect(
			await readJson(
				join(registry, 'families/fontsource/example/inspection.json'),
			),
		).toMatchObject({
			files: [
				{ path: 'sources/example/files/Example-Regular.ttf', weight: 400 },
			],
		});
		expect(
			await readFile(
				join(registry, 'families/fontsource/example/description.en-US.md'),
				'utf8',
			),
		).toBe('# Example\n');
	});

	it('rejects packaged webfonts as sources', () => {
		expect(
			sourceFamilySchema.safeParse({
				id: 'example',
				family: 'Example',
				classifications: ['sans-serif'],
				license: { id: 'OFL-1.1', url: 'https://example.com/license' },
				declaredSubsets: ['latin'],
				sourceFiles: [{ path: 'files/Example.woff2' }],
			}).success,
		).toBe(false);
	});

	it('regenerates deterministically, preserves policy, and retains missing families', async () => {
		const google = await createGoogleRepository();
		const nam = await createNamRepository();
		const registry = await temporaryDirectory('registry');

		await generateRegistry(
			google.repository,
			google.revision,
			nam.repository,
			nam.revision,
			registry,
		);
		await addRetainedRegistryState(registry);

		await writeFixture(
			google.repository,
			'README.md',
			'Unrelated repository change\n',
		);
		const unrelatedRevision = commitAll(
			google.repository,
			'unrelated repository change',
		);
		await generateRegistry(
			google.repository,
			unrelatedRevision,
			nam.repository,
			nam.revision,
			registry,
		);
		const freshRegistry = await temporaryDirectory('fresh-registry');
		await generateRegistry(
			google.repository,
			unrelatedRevision,
			nam.repository,
			nam.revision,
			freshRegistry,
		);
		await addRetainedRegistryState(freshRegistry);
		expect(await treeHashes(registry)).toEqual(await treeHashes(freshRegistry));
		expect(
			await readJson(join(registry, 'families/google/abel/metadata.json')),
		).toMatchObject({
			classifications: ['sans-serif'],
			tags: ['expressive/business'],
			languages: ['en_Latn'],
			primaryLanguage: 'en_Latn',
			primaryScript: 'Latn',
			sampleText: {
				styles: 'All people are born free',
				tester: 'All people are born free and equal',
			},
			provenance: { revision: google.revision },
		});
		expect(await readJson(join(registry, 'languages.json'))).toMatchObject({
			en_Latn: {
				language: 'en',
				script: 'Latn',
				name: 'English',
				autonym: 'English',
				requiredCodepoints: [65, 66, 67],
			},
			zy_Latn: {
				requiredCodepoints: [65, 129_760],
			},
			zz_Latn: {
				requiredCodepoints: [65, 197, 778, 129_760],
			},
		});
		expect(
			await readJson(
				join(registry, 'families/google/recursive-sans/metadata.json'),
			),
		).toMatchObject({
			classifications: ['display', 'sans-serif'],
			tags: ['sans/humanist'],
		});
		expect(await readJson(join(registry, 'subsets/latin.json'))).toMatchObject({
			source: { revision: nam.revision },
		});
		expect(
			await readJson(join(registry, 'families/google/abel/policy.json')),
		).toEqual(ABEL_POLICY);
		expect(
			await readJson(
				join(registry, 'families/fontsource/example/metadata.json'),
			),
		).toMatchObject({ provider: 'fontsource', status: 'active' });
		const description = await readFile(
			join(registry, 'families/google/abel/description.en-US.md'),
			'utf8',
		);
		expect(description).not.toContain('javascript:');
		expect(description).not.toContain('alert(1)');
		expect(description).toContain('[safe](https://example.com/info)');

		await rm(join(google.repository, 'ofl/abel'), { recursive: true });
		const removedRevision = commitAll(google.repository, 'remove Abel');
		await generateRegistry(
			google.repository,
			removedRevision,
			nam.repository,
			nam.revision,
			registry,
		);
		const metadata = await readJson(
			join(registry, 'families/google/abel/metadata.json'),
		);
		expect(metadata).toMatchObject({
			status: 'deprecated',
			provenance: { revision: google.revision },
		});
	}, 30_000);
});
