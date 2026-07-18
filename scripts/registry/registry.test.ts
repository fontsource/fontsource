import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
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
import { join, relative, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { bootstrapPolicy } from './bootstrap-policy.ts';
import { generateRegistry } from './generate.ts';
import { openGitSnapshot } from './git.ts';
import type {
	FamilyInspection,
	FamilyMetadata,
	FamilyPolicy,
} from './schema.ts';
import { canonicalJson, compareStrings, readJson } from './shared.ts';
import { validatePolicyResolution } from './validator.ts';

const temporaryDirectories: string[] = [];

afterEach(async () => {
	await Promise.all(
		temporaryDirectories
			.splice(0)
			.map((path) => rm(path, { recursive: true, force: true })),
	);
});

const temporaryDirectory = async (name: string): Promise<string> => {
	const path = await mkdtemp(join(tmpdir(), `${name}-`));
	temporaryDirectories.push(path);
	return path;
};

const write = async (
	root: string,
	path: string,
	contents: string,
): Promise<void> => {
	const output = join(root, path);
	await mkdir(resolve(output, '..'), { recursive: true });
	await writeFile(output, contents);
};

const git = (repository: string, args: string[]): string =>
	execFileSync('git', ['-C', repository, ...args], {
		env: {
			...process.env,
			GIT_AUTHOR_DATE: '2026-01-02T00:00:00Z',
			GIT_COMMITTER_DATE: '2026-01-02T00:00:00Z',
		},
	})
		.toString('utf8')
		.trim();

const commit = (repository: string, message: string): string => {
	git(repository, ['add', '.']);
	git(repository, ['commit', '-q', '-m', message]);
	return git(repository, ['rev-parse', 'HEAD']);
};

const createRepository = async (name: string): Promise<string> => {
	const repository = await temporaryDirectory(name);
	git(repository, ['init', '-q', '--initial-branch=main']);
	git(repository, ['config', 'user.name', 'Registry Tests']);
	git(repository, ['config', 'user.email', 'registry@example.com']);
	return repository;
};

const copyFont = async (
	repository: string,
	fixture: string,
	path: string,
): Promise<void> => {
	const output = join(repository, path);
	await mkdir(resolve(output, '..'), { recursive: true });
	await cp(resolve('packages/core/tests/fixtures/fonts', fixture), output);
};

const treeHashes = async (
	root: string,
	directory = root,
): Promise<Record<string, string>> => {
	const result: Record<string, string> = {};
	for (const entry of await readdir(directory, { withFileTypes: true })) {
		const path = join(directory, entry.name);
		if (entry.isDirectory()) {
			Object.assign(result, await treeHashes(root, path));
		} else {
			result[relative(root, path)] = createHash('sha256')
				.update(await readFile(path))
				.digest('hex');
		}
	}
	return Object.fromEntries(
		Object.entries(result).sort(([left], [right]) =>
			compareStrings(left, right),
		),
	);
};

const createGoogleRepository = async (): Promise<{
	repository: string;
	revision: string;
}> => {
	const repository = await createRepository('google-fonts');
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
	await write(
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
`,
	);
	await write(
		repository,
		'ofl/recursive/METADATA.pb',
		`name: "Recursive Sans"
designer: "Arrow Type"
license: "OFL"
category: "SANS_SERIF"
date_added: "2020-01-01"
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
	await write(
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
		await write(repository, `ofl/${id}/OFL.txt`, `License for ${id}\n`);
	}
	await write(
		repository,
		'ofl/abel/DESCRIPTION.en_us.html',
		'<h1>Abel</h1><script>alert(1)</script><a href="javascript:alert(1)">bad</a><a href="https://example.com/info">safe</a>',
	);
	await write(
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
	return {
		repository,
		revision: commit(repository, 'initial Google snapshot'),
	};
};

const createNamRepository = async (): Promise<{
	repository: string;
	revision: string;
}> => {
	const repository = await createRepository('nam-files');
	await write(
		repository,
		'Lib/gfsubsets/data/latin_unique-glyphs.nam',
		'0x0020 SPACE\n0x0021 EXCLAMATION\n0x0022 QUOTATION MARK\n',
	);
	await write(
		repository,
		'slices/japanese_default.txt',
		'subsets { codepoints: 66 }\nsubsets { codepoints: 65 }\n',
	);
	return { repository, revision: commit(repository, 'initial NAM snapshot') };
};

const createFontFilesRepository = async (): Promise<{
	repository: string;
	revision: string;
}> => {
	const repository = await createRepository('font-files');
	await write(
		repository,
		'metadata/fontsource.json',
		canonicalJson({
			abel: {
				subsets: ['latin'],
				defSubset: 'latin',
				weights: [400, 700],
				styles: ['normal', 'italic'],
			},
			'recursive-sans': {
				subsets: ['latin'],
				defSubset: 'latin',
			},
			'stale-sans': {
				subsets: ['latin'],
				defSubset: 'latin',
			},
		}),
	);
	await write(repository, 'fonts/google/abel/400.css', '');
	await write(repository, 'fonts/variable/recursive-sans/full.css', '');
	await write(repository, 'fonts/variable/recursive-sans/wght.css', '');
	await write(repository, 'fonts/variable/stale-sans/mono.css', '');
	return {
		repository,
		revision: commit(repository, 'legacy package inventory'),
	};
};

describe('registry ingestion', () => {
	it('rejects shallow repositories that cannot prove source history', async () => {
		const source = await createRepository('source-history');
		await write(source, 'family/METADATA.pb', 'name: "Example"\n');
		const revision = commit(source, 'source history');
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

	it('regenerates deterministically, bootstraps explicit variants, and retains missing families', async () => {
		const google = await createGoogleRepository();
		const nam = await createNamRepository();
		const fontFiles = await createFontFilesRepository();
		const registry = await temporaryDirectory('registry');

		await generateRegistry(
			google.repository,
			google.revision,
			nam.repository,
			nam.revision,
			registry,
		);

		await write(
			google.repository,
			'README.md',
			'Unrelated repository change\n',
		);
		const unrelatedRevision = commit(
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
		expect(await treeHashes(registry)).toEqual(await treeHashes(freshRegistry));
		expect(
			await readJson(join(registry, 'families/abel/metadata.json')),
		).toMatchObject({
			origin: { revision: google.revision },
		});
		expect(await readJson(join(registry, 'subsets/latin.json'))).toMatchObject({
			source: { revision: nam.revision },
		});

		await bootstrapPolicy(fontFiles.repository, fontFiles.revision, registry);

		const abelPolicy = await readJson(
			join(registry, 'families/abel/policy.json'),
		);
		expect(abelPolicy).toMatchObject({
			packages: { static: { variants: [{ weight: 400, style: 'normal' }] } },
		});
		const recursivePolicy = await readJson(
			join(registry, 'families/recursive-sans/policy.json'),
		);
		expect(recursivePolicy).toMatchObject({
			packages: {
				variable: {
					variants: [
						{ axisKey: 'full', style: 'normal' },
						{ axisKey: 'wght', style: 'normal' },
					],
				},
			},
		});
		await expect(
			readFile(join(registry, 'families/stale-sans/policy.json')),
		).rejects.toMatchObject({ code: 'ENOENT' });
		const description = await readFile(
			join(registry, 'families/abel/description.en-US.md'),
			'utf8',
		);
		expect(description).not.toContain('javascript:');
		expect(description).not.toContain('alert(1)');
		expect(description).toContain('[safe](https://example.com/info)');

		await rm(join(google.repository, 'ofl/abel'), { recursive: true });
		const removedRevision = commit(google.repository, 'remove Abel');
		await generateRegistry(
			google.repository,
			removedRevision,
			nam.repository,
			nam.revision,
			registry,
		);
		const metadata = await readJson(
			join(registry, 'families/abel/metadata.json'),
		);
		expect(metadata).toMatchObject({
			origin: { available: false, revision: google.revision },
		});
	}, 30_000);
});

describe('variant validation', () => {
	it('accepts a sparse static relation and rejects a phantom cross-product', () => {
		const revision = 'a'.repeat(40);
		const variants = [
			{ weight: 300, style: 'normal' },
			{ weight: 400, style: 'italic' },
		] as const;
		const files = variants
			.map((variant) => ({
				path: `ofl/neuton/Neuton-${variant.weight}-${variant.style}.ttf`,
				variant,
			}))
			.sort((left, right) => compareStrings(left.path, right.path));
		const metadata: FamilyMetadata = {
			id: 'neuton',
			family: 'Neuton',
			category: 'serif',
			sourceModified: '2026-01-02',
			license: { id: 'OFL-1.1', url: 'https://example.com/license' },
			origin: {
				upstream: 'googleFonts',
				revision,
				directory: 'ofl/neuton',
				available: true,
			},
			declaredSubsets: ['latin'],
			sourceFiles: files.map((file) => ({
				path: file.path,
				sha256: '0'.repeat(64),
				size: 1,
				variant: file.variant,
			})),
		};
		const inspection: FamilyInspection = {
			files: files.map((file) => ({
				path: file.path,
				fontVersion: 'Version 1.0',
				weight: file.variant.weight,
				style: file.variant.style,
				axes: [],
				cmap: { codepointCount: 95, sha256: '1'.repeat(64) },
				outline: 'glyf',
				colorTables: [],
			})),
		};
		const policy: FamilyPolicy = {
			packages: { static: { variants: [...variants] } },
			defaultSubset: 'latin',
			subsets: [{ id: 'latin', definition: 'latin' }],
		};

		expect(() =>
			validatePolicyResolution(policy, metadata, inspection, 'neuton'),
		).not.toThrow();
		expect(() =>
			validatePolicyResolution(
				{
					...policy,
					packages: {
						static: {
							variants: [...variants, { weight: 300, style: 'italic' }],
						},
					},
				},
				metadata,
				inspection,
				'neuton',
			),
		).toThrow('neuton static 300 italic must resolve to one source');
	});
});
