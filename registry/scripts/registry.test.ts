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
	familySchema,
	languageCatalogSchema,
	sourceFamilySchema,
	upstreamsSchema,
} from './schema.ts';
import { canonicalJson, compareStrings, readJson, sha256 } from './shared.ts';
import { listFamilyKeys, validateRegistry } from './validator.ts';

const ABEL_DISTRIBUTION = {
	static: [{ weight: 400, style: 'normal' }],
	characters: {
		defaultSubset: 'latin',
		subsets: [{ id: 'latin', definition: 'latin' }],
		slicing: 'japanese-web',
	},
} as const;

const TEST_LANGUAGES = languageCatalogSchema.parse({
	en_Latn: {
		language: 'en',
		script: 'Latn',
		name: 'English',
		requiredCodepoints: [65, 66, 67],
	},
	zz_Latn: {
		language: 'zz',
		script: 'Latn',
		name: 'Test language',
		requiredCodepoints: [0x10ffff],
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

const createGoogleIconsRepository = async (): Promise<{
	repository: string;
	revision: string;
}> => {
	const repository = await createGitRepository('google-icons');
	const staticFonts = [
		'MaterialIcons-Regular.ttf',
		'MaterialIconsOutlined-Regular.otf',
		'MaterialIconsRound-Regular.otf',
		'MaterialIconsSharp-Regular.otf',
		'MaterialIconsTwoTone-Regular.otf',
	];
	const variableFonts = [
		'MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].ttf',
		'MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf',
		'MaterialSymbolsSharp[FILL,GRAD,opsz,wght].ttf',
	];
	for (const filename of staticFonts) {
		await copyFont(repository, 'abel-latin-400-normal.ttf', `font/${filename}`);
		await writeFixture(
			repository,
			`font/${filename.replace(/\.(?:otf|ttf)$/, '.codepoints')}`,
			filename === 'MaterialIcons-Regular.ttf'
				? 'flourescent 41\nflourescent 42\n'
				: 'home 41\n',
		);
	}
	for (const filename of variableFonts) {
		await copyFont(
			repository,
			'recursive-latin-full-normal.ttf',
			`variablefont/${filename}`,
		);
		await writeFixture(
			repository,
			`variablefont/${filename.replace(/\.ttf$/, '.codepoints')}`,
			'home 41\nsettings 42\n',
		);
	}
	await writeFixture(
		repository,
		'update/current_versions.json',
		canonicalJson({
			'action::flourescent': 1,
			'action::home': 1,
			'action::settings': 1,
			'symbols::home': 1,
		}),
	);
	await writeFixture(repository, 'LICENSE', 'Apache License\n');
	return {
		repository,
		revision: commitAll(repository, 'initial Google icons snapshot'),
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
	await copyFont(
		repository,
		'abel-latin-400-normal.ttf',
		'sources/symbols/files/Symbols-Regular.ttf',
	);
	await writeFixture(
		repository,
		'sources/example/metadata.json',
		canonicalJson({
			id: 'example',
			family: 'Example',
			classifications: ['display', 'sans-serif'],
			tags: ['theme/stencil'],
			primaryLanguage: 'zz_Latn',
			primaryScript: 'Latn',
			designer: 'Registry Tests',
			dateAdded: '2026-01-02',
			license: {
				id: 'OFL-1.1',
				url: 'https://openfontlicense.org/open-font-license-official-text/',
			},
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
	await writeFixture(
		repository,
		'sources/symbols/metadata.json',
		canonicalJson({
			id: 'symbols',
			family: 'Symbols',
			classifications: ['symbols'],
			languages: [],
			primaryLanguage: 'en_Latn',
			primaryScript: 'Latn',
			license: {
				id: 'OFL-1.1',
				url: 'https://openfontlicense.org/open-font-license-official-text/',
			},
			sourceFiles: [{ path: 'files/Symbols-Regular.ttf' }],
		}),
	);
	await writeFixture(
		repository,
		'sources/symbols/license.txt',
		'Symbols license\n',
	);
	return {
		repository,
		revision: commitAll(repository, 'initial Fontsource snapshot'),
	};
};

const seedRegistryRequirements = async (root: string): Promise<void> => {
	const families = [
		'fontsource/example',
		'fontsource/symbols',
		'google/abel',
		'google/recursive-sans',
		'google/stale-sans',
		'google-icons/material-icons',
		'google-icons/material-icons-outlined',
		'google-icons/material-icons-round',
		'google-icons/material-icons-sharp',
		'google-icons/material-icons-two-tone',
		'google-icons/material-symbols-outlined',
		'google-icons/material-symbols-rounded',
		'google-icons/material-symbols-sharp',
	];
	await Promise.all(
		families.map((family) =>
			writeFixture(
				root,
				`families/${family}/distribution.json`,
				canonicalJson(
					family === 'google/abel'
						? ABEL_DISTRIBUTION
						: {
								static: [{ weight: 400, style: 'normal' }],
								characters: 'all',
							},
				),
			),
		),
	);
	await writeFixture(
		root,
		'family-overrides.json',
		canonicalJson({
			example: {
				languages: [],
				sampleText: { short: 'ABC' },
			},
		}),
	);
};

describe('registry ingestion', () => {
	it('archives only committed registry data', async () => {
		const repository = await createGitRepository('committed-registry');
		await writeFixture(repository, 'registry/data/upstreams.json', '{}\n');
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
			'upstreams.json',
			canonicalJson(
				upstreamsSchema.parse({
					googleFonts: {
						repository: 'google/fonts',
						revision: '1'.repeat(40),
					},
					googleIcons: {
						repository: 'google/material-design-icons',
						revision: '4'.repeat(40),
					},
					namFiles: {
						repository: 'googlefonts/nam-files',
						revision: '2'.repeat(40),
					},
					fontFiles: {
						repository: 'fontsource/font-files',
						revision: '3'.repeat(40),
					},
				}),
			),
		);
		for (const provider of ['fontsource', 'google']) {
			await writeFixture(
				registry,
				`families/${provider}/abel/family.json`,
				'{}\n',
			);
		}

		await expect(validateRegistry(registry)).rejects.toThrow(
			'Duplicate registry family ID abel',
		);
	});

	it('ingests a Fontsource source family', async () => {
		const source = await createFontFilesRepository();
		const registry = await temporaryDirectory('font-files-registry');
		const snapshot = openGitSnapshot(source.repository, source.revision);

		await expect(
			generateFontFiles(snapshot, registry, [], TEST_LANGUAGES),
		).resolves.toEqual(['example', 'symbols']);
		expect(
			await readJson(join(registry, 'families/fontsource/example/family.json')),
		).toMatchObject({
			status: 'active',
			classifications: ['display', 'sans-serif'],
			tags: ['theme/stencil'],
			languages: ['en_Latn', 'zz_Latn'],
			primaryLanguage: 'zz_Latn',
			provenance: {
				type: 'github',
				repository: 'fontsource/font-files',
				revision: source.revision,
				directory: 'sources/example',
			},
			sources: [
				{
					path: 'sources/example/files/Example-Regular.ttf',
					variant: { weight: 400, style: 'normal' },
					inspection: { weight: 400 },
				},
			],
		});
		expect(
			await readFile(
				join(registry, 'families/fontsource/example/description.en-US.md'),
				'utf8',
			),
		).toBe('# Example\n');
		const symbols = await readJson(
			join(registry, 'families/fontsource/symbols/family.json'),
		);
		expect(symbols).toMatchObject({ languages: [], primaryScript: 'Latn' });
		expect(symbols).not.toHaveProperty('primaryLanguage');
	});

	it('rejects packaged webfonts as sources', () => {
		expect(
			sourceFamilySchema.safeParse({
				id: 'example',
				family: 'Example',
				classifications: ['sans-serif'],
				license: { id: 'OFL-1.1', url: 'https://example.com/license' },
				sourceFiles: [{ path: 'files/Example.woff2' }],
			}).success,
		).toBe(false);
	});

	it('regenerates deterministically, applies replacements, and retains missing families', async () => {
		const google = await createGoogleRepository();
		const googleIcons = await createGoogleIconsRepository();
		const nam = await createNamRepository();
		const fontFiles = await createFontFilesRepository();
		const registry = await temporaryDirectory('registry');
		await seedRegistryRequirements(registry);

		await generateRegistry(
			google.repository,
			google.revision,
			googleIcons.repository,
			googleIcons.revision,
			nam.repository,
			nam.revision,
			fontFiles.repository,
			fontFiles.revision,
			registry,
		);
		await writeFixture(
			registry,
			'replacements.json',
			canonicalJson({ abel: 'recursive-sans' }),
		);

		await rm(join(google.repository, 'ofl/stalesans/OFL.txt'));
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
			googleIcons.repository,
			googleIcons.revision,
			nam.repository,
			nam.revision,
			fontFiles.repository,
			fontFiles.revision,
			registry,
		);
		const freshRegistry = await temporaryDirectory('fresh-registry');
		await seedRegistryRequirements(freshRegistry);
		await generateRegistry(
			google.repository,
			google.revision,
			googleIcons.repository,
			googleIcons.revision,
			nam.repository,
			nam.revision,
			fontFiles.repository,
			fontFiles.revision,
			freshRegistry,
		);
		await writeFixture(
			freshRegistry,
			'replacements.json',
			canonicalJson({ abel: 'recursive-sans' }),
		);
		await generateRegistry(
			google.repository,
			unrelatedRevision,
			googleIcons.repository,
			googleIcons.revision,
			nam.repository,
			nam.revision,
			fontFiles.repository,
			fontFiles.revision,
			freshRegistry,
		);
		expect(await treeHashes(registry)).toEqual(await treeHashes(freshRegistry));
		expect(
			await readJson(join(registry, 'families/google/abel/family.json')),
		).toMatchObject({
			classifications: ['sans-serif'],
			tags: ['expressive/business'],
			languages: ['en_Latn'],
			primaryLanguage: 'en_Latn',
			primaryScript: 'Latn',
			sampleText: {
				short: 'All people are born free',
				long: 'All people are born free and equal',
			},
			provenance: { revision: google.revision },
			status: 'deprecated',
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
				join(registry, 'families/google/recursive-sans/family.json'),
			),
		).toMatchObject({
			classifications: ['display', 'sans-serif'],
			tags: ['sans/humanist'],
		});
		const overriddenFamily = await readJson(
			join(registry, 'families/fontsource/example/family.json'),
		);
		expect(overriddenFamily).toMatchObject({
			languages: [],
			sampleText: { short: 'ABC' },
		});
		expect(overriddenFamily).not.toHaveProperty('primaryLanguage');
		expect(await readJson(join(registry, 'subsets/latin.json'))).toMatchObject({
			source: { revision: nam.revision },
		});
		expect(
			await readJson(join(registry, 'families/google/abel/distribution.json')),
		).toEqual(ABEL_DISTRIBUTION);
		expect(
			await readFile(
				join(registry, 'families/google/stale-sans/license.txt'),
				'utf8',
			),
		).toBe('License for stalesans\n');
		const missingFallbackRegistry = await temporaryDirectory(
			'missing-license-fallback',
		);
		await seedRegistryRequirements(missingFallbackRegistry);
		await expect(
			generateRegistry(
				google.repository,
				unrelatedRevision,
				googleIcons.repository,
				googleIcons.revision,
				nam.repository,
				nam.revision,
				fontFiles.repository,
				fontFiles.revision,
				missingFallbackRegistry,
			),
		).rejects.toThrow('stale-sans has no license file');
		expect(
			await readJson(join(registry, 'families/fontsource/example/family.json')),
		).toMatchObject({ status: 'active' });
		expect(
			upstreamsSchema.parse(await readJson(join(registry, 'upstreams.json'))),
		).toMatchObject({
			googleFonts: { revision: unrelatedRevision },
			fontFiles: { revision: fontFiles.revision },
		});
		const familyKeys = await listFamilyKeys(registry);
		expect(
			familyKeys.filter((family) => family.startsWith('google-icons/')),
		).toEqual([
			'google-icons/material-icons',
			'google-icons/material-icons-outlined',
			'google-icons/material-icons-round',
			'google-icons/material-icons-sharp',
			'google-icons/material-icons-two-tone',
			'google-icons/material-symbols-outlined',
			'google-icons/material-symbols-rounded',
			'google-icons/material-symbols-sharp',
		]);
		expect(
			await readJson(
				join(registry, 'families/google-icons/material-icons/family.json'),
			),
		).toMatchObject({
			classifications: ['symbols'],
			tags: ['special-use/icons'],
			languages: [],
			license: { id: 'Apache-2.0' },
			sources: [
				{
					path: 'font/MaterialIcons-Regular.ttf',
					variant: { weight: 400, style: 'normal' },
				},
			],
		});
		expect(
			await readJson(
				join(registry, 'families/google-icons/material-icons/icons.json'),
			),
		).toMatchObject({
			inputModes: ['codepoint', 'name-ligature'],
			icons: [
				{ name: 'flourescent', codepoint: 65, categories: ['action'] },
				{ name: 'flourescent', codepoint: 66, categories: ['action'] },
			],
			categoriesSource: { path: 'update/current_versions.json' },
			source: {
				path: 'font/MaterialIcons-Regular.codepoints',
			},
		});
		expect(
			await readJson(
				join(
					registry,
					'families/google-icons/material-symbols-outlined/family.json',
				),
			),
		).toMatchObject({
			sources: [
				{
					path: 'variablefont/MaterialSymbolsOutlined[FILL,GRAD,opsz,wght].ttf',
					inspection: {
						axes: expect.arrayContaining([
							expect.objectContaining({ tag: 'wght' }),
						]),
					},
				},
			],
		});
		const description = await readFile(
			join(registry, 'families/google/abel/description.en-US.md'),
			'utf8',
		);
		expect(description).not.toContain('javascript:');
		expect(description).not.toContain('alert(1)');
		expect(description).toContain('[safe](https://example.com/info)');

		await rm(join(google.repository, 'ofl/abel'), { recursive: true });
		const removedRevision = commitAll(google.repository, 'remove Abel');
		await rm(join(fontFiles.repository, 'sources/symbols'), {
			recursive: true,
		});
		const removedFontFilesRevision = commitAll(
			fontFiles.repository,
			'remove Symbols',
		);
		await rm(join(googleIcons.repository, 'font/MaterialIcons-Regular.ttf'));
		await rm(
			join(googleIcons.repository, 'font/MaterialIcons-Regular.codepoints'),
		);
		const removedGoogleIconsRevision = commitAll(
			googleIcons.repository,
			'remove Material Icons',
		);
		await generateRegistry(
			google.repository,
			removedRevision,
			googleIcons.repository,
			removedGoogleIconsRevision,
			nam.repository,
			nam.revision,
			fontFiles.repository,
			removedFontFilesRevision,
			registry,
		);
		const metadata = await readJson(
			join(registry, 'families/google/abel/family.json'),
		);
		expect(metadata).toMatchObject({
			status: 'deprecated',
			provenance: { revision: google.revision },
		});
		expect(
			await readJson(join(registry, 'families/fontsource/symbols/family.json')),
		).toMatchObject({
			status: 'deprecated',
			provenance: { revision: fontFiles.revision },
		});
		expect(
			await readJson(
				join(registry, 'families/google-icons/material-icons/family.json'),
			),
		).toMatchObject({
			status: 'deprecated',
			provenance: { revision: googleIcons.revision },
		});

		const staleMetadataPath = join(
			google.repository,
			'ofl/stalesans/METADATA.pb',
		);
		await writeFile(
			staleMetadataPath,
			(await readFile(staleMetadataPath, 'utf8')).replace(
				'license: "OFL"',
				'license: "APACHE2"',
			),
		);
		const changedLicenseRevision = commitAll(
			google.repository,
			'change Stale Sans license',
		);
		const changedLicenseRegistry = await temporaryDirectory(
			'changed-license-fallback',
		);
		await seedRegistryRequirements(changedLicenseRegistry);
		await generateRegistry(
			google.repository,
			google.revision,
			googleIcons.repository,
			googleIcons.revision,
			nam.repository,
			nam.revision,
			fontFiles.repository,
			fontFiles.revision,
			changedLicenseRegistry,
		);
		await expect(
			generateRegistry(
				google.repository,
				changedLicenseRevision,
				googleIcons.repository,
				removedGoogleIconsRevision,
				nam.repository,
				nam.revision,
				fontFiles.repository,
				removedFontFilesRevision,
				changedLicenseRegistry,
			),
		).rejects.toThrow('stale-sans license changed from OFL-1.1 to Apache-2.0');

		const replacementPath = join(
			registry,
			'families/google/recursive-sans/family.json',
		);
		const replacement = familySchema.parse(await readJson(replacementPath));
		await writeFixture(
			registry,
			'families/google/recursive-sans/family.json',
			canonicalJson({
				...replacement,
				status: 'deprecated',
			}),
		);
		await expect(validateRegistry(registry)).rejects.toThrow(
			'Replacement target recursive-sans must be active',
		);
	}, 30_000);
});
