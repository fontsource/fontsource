import { createHash } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFontContext } from '@fontsource-utils/core';
import { expect, it, vi } from 'vitest';
import type { RegistryFamilyDetail } from '../../../api/shared/registry';
import { loadStaticFontFixture } from '../../core/tests/font-fixture';
import { buildFamily } from './build';
import { writePackage } from './package';
import { loadBuildInputs } from './registry';

it('freezes one registry revision, builds a package offline, and rejects changed source bytes', async () => {
	const directory = await mkdtemp(join(tmpdir(), 'fontsource-v6-'));
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
	const context = createFontContext();
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
		const inputs = await loadBuildInputs(['abel'], inputsDirectory);
		const result = await buildFamily(
			context,
			inputs.families[0],
			inputs,
			false,
		);
		const output = join(directory, 'package');
		await writePackage(output, inputs.families[0], result, false);
		expect({
			files: (await readdir(output, { recursive: true })).sort(),
			manifest: JSON.parse(
				await readFile(join(output, 'package.json'), 'utf8'),
			),
			css: await readFile(join(output, 'index.css'), 'utf8'),
		}).toMatchSnapshot();
		await writeFile(join(inputsDirectory, 'sources', sha256), 'changed');
		await expect(loadBuildInputs(['abel'], inputsDirectory)).rejects.toThrow(
			'source integrity mismatch',
		);
	} finally {
		vi.unstubAllGlobals();
		context.destroy();
		await rm(directory, { recursive: true, force: true });
	}
});
