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
import { generateRegistry } from './generate.ts';
import { assertGitPathClean, openGitSnapshot } from './git.ts';
import { canonicalJson, compareStrings, readJson, sha256 } from './shared.ts';

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
		const abelPolicy = {
			packages: {
				static: { variants: [{ weight: 400, style: 'normal' }] },
			},
			defaultSubset: 'latin',
			subsets: [{ id: 'latin', definition: 'latin' }],
		};
		await writeFixture(
			registry,
			'families/abel/policy.json',
			canonicalJson(abelPolicy),
		);

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
		await writeFixture(
			freshRegistry,
			'families/abel/policy.json',
			canonicalJson(abelPolicy),
		);
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
		expect(await readJson(join(registry, 'families/abel/policy.json'))).toEqual(
			abelPolicy,
		);
		const description = await readFile(
			join(registry, 'families/abel/description.en-US.md'),
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
			join(registry, 'families/abel/metadata.json'),
		);
		expect(metadata).toMatchObject({
			origin: { available: false, revision: google.revision },
		});
	}, 30_000);
});
