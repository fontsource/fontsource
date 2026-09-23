import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import {
	RegistryFamilyDetailSchema,
	RegistryFamilySymbolsSchema,
	RegistrySourceCapabilitiesSchema,
} from '../../api/shared/registry.ts';

const r2 = vi.hoisted(() => ({
	putCurrentObject: vi.fn(),
	putObject: vi.fn(),
	putSourcePreview: vi.fn(),
}));

vi.mock('./r2.ts', () => r2);

import { publishArchive } from './archive.ts';
import {
	archiveManifestSchema,
	familyOverridesSchema,
	familyTagsSchema,
	replacementRegistrySchema,
} from './schema.ts';
import { readJson, writeJson } from './shared.ts';

const REGISTRY_ROOT = resolve(import.meta.dirname, '../data');
const REVISION = 'a'.repeat(40);
// Keep archive coverage independent of the growing catalog. CI validates the full registry.
const FAMILY_KEYS = [
	'google/abel',
	'fontsource/adwaita-sans',
	'google/alegreya-sans',
	'fontsource/bravura',
	'fontsource/dejavu-math',
	'fontsource/dseg7-classic',
	'google/ek-mukta',
	'google/ibm-plex-mono',
	'google/jsmath-cmr10',
	'google-icons/material-icons',
	'fontsource/metropolis',
	'fontsource/nebula-sans',
	'google/noto-sans-jp',
	'google/noto-color-emoji-compat-test',
	'fontsource/yakuhanjp',
	'google/mukta', // Replacement target for ek-mukta.
];

describe('registry source archive', () => {
	let root: string;
	beforeAll(async () => {
		root = await mkdtemp(join(tmpdir(), 'registry-archive-'));
		await Promise.all(
			[
				'upstreams.json',
				'axes.json',
				'languages.json',
				'taxonomy.json',
				'subsets',
				...FAMILY_KEYS.map((key) => `families/${key}`),
			].map((path) =>
				cp(join(REGISTRY_ROOT, path), join(root, path), { recursive: true }),
			),
		);
		const ids = new Set(FAMILY_KEYS.map((key) => key.split('/')[1]));
		const tags = familyTagsSchema.parse(
			await readJson(join(REGISTRY_ROOT, 'family-tags.json')),
		);
		await writeJson(
			join(root, 'family-tags.json'),
			Object.fromEntries(
				Object.entries(tags)
					.map(
						([tag, families]) =>
							[tag, families.filter((id) => ids.has(id))] as const,
					)
					.filter(([, families]) => families.length > 0),
			),
		);
		const overrides = familyOverridesSchema.parse(
			await readJson(join(REGISTRY_ROOT, 'family-overrides.json')),
		);
		await writeJson(
			join(root, 'family-overrides.json'),
			Object.fromEntries(
				Object.entries(overrides).filter(([id]) => ids.has(id)),
			),
		);
		const replacements = replacementRegistrySchema.parse(
			await readJson(join(REGISTRY_ROOT, 'replacements.json')),
		);
		await writeJson(
			join(root, 'replacements.json'),
			Object.fromEntries(
				Object.entries(replacements).filter(([id]) => ids.has(id)),
			),
		);
	});
	afterAll(async () => {
		if (root) await rm(root, { recursive: true, force: true });
	});
	beforeEach(() => {
		vi.resetAllMocks();
		r2.putObject.mockResolvedValue(undefined);
	});
	it('rejects non-commit snapshot revisions', () => {
		expect(() =>
			archiveManifestSchema.parse({
				schemaVersion: 1,
				registryRevision: 'latest',
				registry: [],
				views: [],
				sources: [],
			}),
		).toThrow();
	});

	it('publishes archive objects before the manifest and current pointer', async () => {
		const keys: string[] = [];
		const views = new Map<string, unknown>();
		const previewHashes = new Set<string>();
		const distributedHashes = new Set<string>();
		const wantedViews = new Set([
			'families.json',
			'families/abel.json',
			'families/adwaita-sans.json',
			'families/alegreya-sans.json',
			'families/bravura.json',
			'families/dejavu-math.json',
			'families/dseg7-classic.json',
			'families/ek-mukta.json',
			'families/ibm-plex-mono.json',
			'families/jsmath-cmr10.json',
			'families/material-icons.json',
			'families/material-icons/symbols.json',
			'families/metropolis.json',
			'families/nebula-sans.json',
			'families/noto-sans-jp.json',
			'families/noto-color-emoji-compat-test.json',
			'families/yakuhanjp.json',
			'languages.json',
		]);
		let manifest: unknown;
		let current: unknown;
		let sourceContentType: string | undefined;
		r2.putObject.mockImplementation(
			async (object: {
				key: string;
				contentType?: string;
				read: () => Promise<Uint8Array>;
			}) => {
				keys.push(object.key);
				if (object.key.startsWith('sources/') && !sourceContentType) {
					sourceContentType = object.contentType;
				}
				if (object.key.endsWith('/manifest.json')) {
					manifest = JSON.parse(
						Buffer.from(await object.read()).toString('utf8'),
					);
				}
				const marker = '/api/';
				const viewIndex = object.key.indexOf(marker);
				if (viewIndex >= 0) {
					const path = object.key.slice(viewIndex + marker.length);
					if (path.startsWith('families/') && !path.endsWith('/symbols.json')) {
						const family = RegistryFamilyDetailSchema.parse(
							JSON.parse(Buffer.from(await object.read()).toString('utf8')),
						);
						const distributed = new Set(
							[
								...(family.distribution.static ?? []),
								...(family.distribution.variable ?? []),
							].map(({ source }) => source),
						);
						for (const source of family.sources) {
							expect(Boolean(source.previewUrl)).toBe(
								distributed.has(source.sha256),
							);
						}
						for (const hash of distributed) distributedHashes.add(hash);
					}
					if (wantedViews.has(path)) {
						const value = JSON.parse(
							Buffer.from(await object.read()).toString('utf8'),
						);
						views.set(path, value);
						if (
							path === 'families/abel.json' ||
							path === 'families/adwaita-sans.json' ||
							path === 'families/ibm-plex-mono.json'
						) {
							for (const source of value.sources) {
								wantedViews.add(`sources/${source.sha256}/capabilities.json`);
							}
						}
					}
				}
			},
		);
		r2.putCurrentObject.mockImplementation(async (body: Uint8Array) => {
			keys.push('current.json');
			current = JSON.parse(Buffer.from(body).toString('utf8'));
		});
		r2.putSourcePreview.mockImplementation(
			async (_ctx, source: { sha256: string }) => {
				expect(previewHashes.has(source.sha256)).toBe(false);
				previewHashes.add(source.sha256);
				keys.push(`preview/${source.sha256}`);
			},
		);

		await publishArchive(root, REVISION);

		expect(keys.at(-2)).toBe(`snapshots/${REVISION}/manifest.json`);
		expect(keys.at(-1)).toBe('current.json');
		expect(previewHashes).toEqual(distributedHashes);
		expect(keys.some((key) => key.startsWith('registry/sha256/'))).toBe(true);
		expect(keys.some((key) => key.startsWith('sources/sha256/'))).toBe(true);
		expect(sourceContentType).toMatch(/^font\/(?:otf|ttf)$/);
		expect(
			keys.some(
				(key) => key === `snapshots/${REVISION}/api/families/abel.json`,
			),
		).toBe(true);
		expect(manifest).toMatchObject({
			schemaVersion: 1,
			registryRevision: REVISION,
			registry: expect.arrayContaining([
				expect.objectContaining({ path: 'upstreams.json' }),
				expect.objectContaining({ path: 'family-tags.json' }),
				expect.objectContaining({ path: 'family-overrides.json' }),
				expect.objectContaining({
					path: 'families/google-icons/material-icons/icons.json',
				}),
			]),
			sources: expect.arrayContaining([
				expect.objectContaining({
					sha256: expect.stringMatching(/^[0-9a-f]{64}$/),
				}),
			]),
			views: expect.arrayContaining([
				expect.objectContaining({ path: 'families/abel.json' }),
				expect.objectContaining({
					path: 'families/material-icons/symbols.json',
				}),
				expect.objectContaining({ path: 'languages.json' }),
				expect.objectContaining({ path: 'taxonomy.json' }),
			]),
		});
		expect(current).toMatchObject({
			schemaVersion: 1,
			registryRevision: REVISION,
		});
		const family = RegistryFamilyDetailSchema.parse(
			views.get('families/abel.json'),
		);
		expect(family).toMatchObject({
			id: 'abel',
			classifications: ['sans-serif'],
			tags: expect.any(Array),
			languages: expect.any(Array),
			license: {
				id: 'OFL-1.1',
				text: expect.any(String),
			},
			content: {
				'en-US': {
					description: expect.any(String),
				},
			},
			distribution: {
				static: [
					{
						weight: 400,
						style: 'normal',
						source: expect.stringMatching(/^[0-9a-f]{64}$/),
					},
				],
				characters: {
					type: 'subsets',
					defaultSubset: 'latin',
					subsets: [{ id: 'latin', definition: 'latin' }],
				},
			},
			previewSource: expect.stringMatching(/^[0-9a-f]{64}$/),
			sources: [
				expect.objectContaining({
					format: 'ttf',
					filename: 'Abel-Regular.ttf',
					glyphCount: expect.any(Number),
					codepointCount: expect.any(Number),
					downloadUrl: expect.stringMatching(
						/^\/v1\/registry\/sources\/[0-9a-f]{64}$/,
					),
					previewUrl: expect.stringMatching(
						/^\/v1\/registry\/sources\/[0-9a-f]{64}\/preview\/1\.woff2$/,
					),
					capabilitiesUrl: expect.stringMatching(
						/^\/v1\/registry\/sources\/[0-9a-f]{64}\/capabilities$/,
					),
					type: 'static',
				}),
			],
		});
		const ibmPlexMono = RegistryFamilyDetailSchema.parse(
			views.get('families/ibm-plex-mono.json'),
		);
		expect(ibmPlexMono.previewSource).toBe(
			ibmPlexMono.distribution.static?.find(
				(variant) => variant.weight === 400 && variant.style === 'normal',
			)?.source,
		);
		const ibmPlexMonoCapabilities = views.get(
			`sources/${ibmPlexMono.previewSource}/capabilities.json`,
		);
		expect(
			RegistrySourceCapabilitiesSchema.parse(ibmPlexMonoCapabilities),
		).toEqual(ibmPlexMonoCapabilities);
		const familySource = family.sources[0];
		const capabilities = RegistrySourceCapabilitiesSchema.parse(
			views.get(`sources/${familySource?.sha256}/capabilities.json`),
		);
		expect(capabilities).toMatchObject({
			glyphCount: expect.any(Number),
			codepointCount: expect.any(Number),
			unicodeRange: expect.stringMatching(/^U\+/),
			features: {
				gsub: expect.any(Array),
				gpos: expect.any(Array),
			},
			outline: 'glyf',
			colorTables: expect.any(Array),
		});
		expect(familySource).toMatchObject({
			glyphCount: capabilities.glyphCount,
			codepointCount: capabilities.codepointCount,
		});
		const multiSourceFamily = RegistryFamilyDetailSchema.parse(
			views.get('families/adwaita-sans.json'),
		);
		expect(multiSourceFamily.previewSource).toBe(
			multiSourceFamily.distribution.variable?.find(
				(variant) =>
					variant.axisKey === 'standard' && variant.style === 'normal',
			)?.source,
		);
		const multiSourceCapabilities = multiSourceFamily.sources.map((source) =>
			views.get(`sources/${source.sha256}/capabilities.json`),
		) as Array<{ unicodeRange: string }>;
		expect(
			new Set(
				multiSourceCapabilities.map((capability) => capability.unicodeRange),
			).size,
		).toBeGreaterThan(1);
		const familyWithVariantOverride = views.get('families/alegreya-sans.json');
		expect(familyWithVariantOverride).toMatchObject({
			sources: expect.arrayContaining([
				expect.objectContaining({
					filename: 'AlegreyaSans-Thin.ttf',
					type: 'static',
					weight: 250,
					style: 'normal',
					declaredVariant: { weight: 100, style: 'normal' },
				}),
			]),
		});
		expect(RegistryFamilyDetailSchema.parse(familyWithVariantOverride)).toEqual(
			familyWithVariantOverride,
		);
		expect(views.get('families/dejavu-math.json')).toMatchObject({
			sampleText: { short: '∑ ∫ √ π ≈ ∞' },
			tags: expect.arrayContaining(['special-use/math']),
		});
		expect(views.get('families/bravura.json')).toMatchObject({
			sampleText: { short: '♩♪♫♬♭♮♯' },
			tags: expect.arrayContaining(['special-use/music-symbols']),
		});
		expect(views.get('families/dseg7-classic.json')).toMatchObject({
			sampleText: { short: '0123456789 ABCDEF' },
			tags: expect.arrayContaining(['special-use/digital-display']),
		});
		expect(views.get('families/jsmath-cmr10.json')).toMatchObject({
			languages: [],
			sampleText: { short: 'ABC xyz 123' },
			tags: expect.arrayContaining(['special-use/math']),
		});
		expect(views.get('families/yakuhanjp.json')).toMatchObject({
			languages: [],
			sampleText: expect.any(Object),
			tags: expect.arrayContaining(['special-use/punctuation']),
		});
		expect(
			views.get('families/noto-color-emoji-compat-test.json'),
		).toMatchObject({
			languages: [],
			sampleText: {
				short: '🥰💀✌️🌴🐢🐐🍄⚽🍻👑📸😬👀🚨🏡🕊️🏆😻🌟🧿🍀🎨🍜',
			},
			tags: expect.arrayContaining(['special-use/emoji']),
		});
		const obliqueFamily = views.get('families/nebula-sans.json');
		expect(obliqueFamily).toMatchObject({
			sources: expect.arrayContaining([
				expect.objectContaining({
					style: 'oblique',
					declaredVariant: expect.objectContaining({ style: 'italic' }),
				}),
			]),
		});
		expect(RegistryFamilyDetailSchema.parse(obliqueFamily)).toEqual(
			obliqueFamily,
		);
		const iconFamily = views.get('families/material-icons.json');
		expect(iconFamily).toMatchObject({
			id: 'material-icons',
			provider: 'google-icons',
			classifications: ['symbols'],
			tags: ['special-use/icons'],
			languages: [],
			sampleText: {
				short:
					'photo_camera thumb_up assignment create_new_folder insert_invitation drafts credit_card timer check_box close',
			},
			symbols: {
				catalogUrl: '/v1/registry/families/material-icons/symbols',
				inputModes: ['codepoint', 'name-ligature'],
			},
		});
		expect(RegistryFamilyDetailSchema.parse(iconFamily)).toEqual(iconFamily);
		expect(views.get('families/metropolis.json')).toMatchObject({
			provider: 'fontsource',
			provenance: {
				type: 'github',
				repository: 'https://github.com/fontsource/font-files',
				revision: expect.stringMatching(/^[0-9a-f]{40}$/),
			},
			sources: expect.arrayContaining([
				expect.objectContaining({
					path: expect.stringMatching(/^sources\/metropolis\/files\//),
				}),
			]),
		});
		const symbols = views.get('families/material-icons/symbols.json');
		expect(RegistryFamilySymbolsSchema.parse(symbols)).toEqual(symbols);
		const replacement = views.get('families/ek-mukta.json');
		expect(replacement).toMatchObject({
			id: 'ek-mukta',
			status: 'deprecated',
			replacedBy: 'mukta',
		});
		expect(RegistryFamilyDetailSchema.parse(replacement)).toEqual(replacement);
		const familyCatalog = views.get('families.json') as
			| Array<Record<string, unknown>>
			| undefined;
		const abelSummary = familyCatalog?.find(({ id }) => id === 'abel');
		expect(abelSummary).toMatchObject({
			id: 'abel',
			axes: [],
			license: {
				id: 'OFL-1.1',
				url: expect.any(String),
			},
		});
		expect(abelSummary).not.toHaveProperty('languages');
		expect(abelSummary).not.toHaveProperty('variable');
		const languageCatalog = views.get('languages.json');
		expect(languageCatalog).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'fa_Arab',
					direction: 'rtl',
					sampleText: expect.any(Object),
				}),
			]),
		);
		const notoSansJp = RegistryFamilyDetailSchema.parse(
			views.get('families/noto-sans-jp.json'),
		);
		expect(notoSansJp).toMatchObject({
			previewSubset: 'japanese',
			distribution: {
				characters: {
					type: 'subsets',
					slicing: 'japanese-web',
					slicingSubset: 'japanese',
				},
			},
		});
		expect(JSON.stringify(languageCatalog)).not.toContain('requiredCodepoints');
	});

	it('does not promote a snapshot when a preview cannot be archived', async () => {
		r2.putSourcePreview.mockRejectedValueOnce(
			new Error('preview upload failed'),
		);
		await expect(publishArchive(root, REVISION)).rejects.toThrow(
			'preview upload failed',
		);
		expect(r2.putCurrentObject).not.toHaveBeenCalled();
		expect(
			r2.putObject.mock.calls.some(([object]) =>
				object.key.endsWith('/manifest.json'),
			),
		).toBe(false);
	});
});
