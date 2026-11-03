import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import type { RegistryFamilyDetail } from '../../../../api/shared/registry';
import { loadBuildInputs } from '../../../../registry/scripts/build/inputs.ts';
import { loadStaticFontFixture } from '../../../core/tests/font-fixture';
import { buildPackages } from '../../src/registry/build';

it('freezes one registry revision, builds a package offline, and rejects changed source bytes', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'fontsource-build-'));
	const source = loadStaticFontFixture();
	const sha256 = createHash('sha256').update(source).digest('hex');
	const revision = 'a'.repeat(40);
	const family: RegistryFamilyDetail = {
		id: 'abel',
		family: 'Abel',
		provider: 'google',
		status: 'active',
		classifications: ['sans-serif'],
		tags: [],
		sourceModified: '2026-01-01',
		axes: [],
		languages: [],
		license: {
			id: 'OFL-1.1',
			url: 'https://openfontlicense.org',
			text: 'Fixture license',
		},
		provenance: { type: 'registry' },
		previewSource: sha256,
		sources: [
			{
				sha256,
				filename: 'Abel.ttf',
				path: 'Abel.ttf',
				format: 'ttf',
				size: source.byteLength,
				downloadUrl: `/v1/registry/sources/${sha256}`,
				capabilitiesUrl: `/v1/registry/sources/${sha256}/capabilities`,
				fontVersion: null,
				glyphCount: 100,
				codepointCount: 100,
				style: 'normal',
				type: 'static',
				weight: 400,
			},
		],
		distribution: {
			static: [{ source: sha256, weight: 400, style: 'normal' }],
			characters: {
				type: 'subsets',
				defaultSubset: 'latin',
				subsets: [
					{ id: 'latin', definition: 'latin' },
					{ id: 'symbols', definition: 'symbols' },
				],
			},
		},
	};
	try {
		vi.stubGlobal('fetch', async (url: URL) => {
			if (url.pathname === family.sources[0].downloadUrl)
				return new Response(Buffer.from(source));
			if (url.pathname === '/v1/registry/families/abel')
				return Response.json(family, {
					headers: { 'X-Registry-Revision': revision },
				});
			// The live pointer could have moved: later reads must explicitly select this revision.
			expect(url.searchParams.get('revision')).toBe(revision);
			const id = url.pathname.split('/').at(-1);
			return Response.json(
				{ id, ranges: id === 'latin' ? [['41', '41']] : [['42', '42']] },
				{ headers: { 'X-Registry-Revision': revision } },
			);
		});
		const inputsDirectory = join(directory, 'inputs');
		await loadBuildInputs(['abel'], inputsDirectory, 'https://registry.test');
		vi.stubGlobal('fetch', () => {
			throw new Error('Offline build attempted a network request');
		});
		const packages = join(directory, 'packages');
		await buildPackages(['abel'], { inputs: inputsDirectory, out: packages });
		const output = join(packages, 'static', 'abel');
		const files = (await readdir(output, { recursive: true })).sort();
		expect({
			files,
			manifest: JSON.parse(
				await readFile(join(output, 'package.json'), 'utf8'),
			),
			output: JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8')),
			css: await Promise.all(
				files
					.filter((filename) => filename.endsWith('.css'))
					.map(async (filename) => ({
						filename,
						content: await readFile(join(output, filename), 'utf8'),
					})),
			),
		}).toMatchSnapshot();
		const custom = join(directory, 'custom');
		await buildPackages(['abel'], {
			inputs: inputsDirectory,
			out: custom,
			text: 'A',
			features: 'kern',
		});
		const customManifest = JSON.parse(
			await readFile(join(custom, 'static/abel/manifest.json'), 'utf8'),
		);
		expect(customManifest.faces).toHaveLength(1);
		expect(customManifest.faces[0]).toMatchObject({
			subset: 'custom',
			unicodeRange: 'U+41',
		});
		await expect(
			buildPackages(['abel'], {
				inputs: inputsDirectory,
				out: join(directory, 'invalid'),
				features: 'invalid',
			}),
		).rejects.toThrow('Invalid OpenType feature tag');
		await writeFile(join(inputsDirectory, 'sources', sha256), 'changed');
		await expect(
			loadBuildInputs(['abel'], inputsDirectory, 'https://registry.test'),
		).rejects.toThrow('source integrity mismatch');
	} finally {
		vi.unstubAllGlobals();
		await rm(directory, { recursive: true, force: true });
	}
});
