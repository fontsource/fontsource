import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { RegistryFamilyDetailSchema } from '../../api/shared/registry.ts';

const r2 = vi.hoisted(() => ({
	putCurrentObject: vi.fn(),
	putObject: vi.fn(),
}));

vi.mock('./r2.ts', () => r2);

import { publishArchive } from './archive.ts';
import { archiveManifestSchema } from './schema.ts';

const REGISTRY_ROOT = resolve(import.meta.dirname, '../data');
const REVISION = 'a'.repeat(40);

describe('registry source archive', () => {
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
					views.set(
						object.key.slice(viewIndex + marker.length),
						JSON.parse(Buffer.from(await object.read()).toString('utf8')),
					);
				}
			},
		);
		r2.putCurrentObject.mockImplementation(async (body: Uint8Array) => {
			keys.push('current.json');
			current = JSON.parse(Buffer.from(body).toString('utf8'));
		});

		await publishArchive(REGISTRY_ROOT, REVISION);

		expect(keys.at(-2)).toBe(`snapshots/${REVISION}/manifest.json`);
		expect(keys.at(-1)).toBe('current.json');
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
				expect.objectContaining({ path: 'languages.json' }),
				expect.objectContaining({ path: 'taxonomy.json' }),
			]),
		});
		expect(current).toMatchObject({
			schemaVersion: 1,
			registryRevision: REVISION,
		});
		const family = views.get('families/abel.json');
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
				static: [{ weight: 400, style: 'normal' }],
				characters: {
					type: 'subsets',
					defaultSubset: 'latin',
					subsets: [{ id: 'latin', definition: 'latin' }],
				},
			},
			sources: [
				expect.objectContaining({
					format: 'ttf',
					filename: 'Abel-Regular.ttf',
					downloadUrl: expect.stringMatching(
						/^\/v1\/registry\/sources\/[0-9a-f]{64}$/,
					),
					type: 'static',
				}),
			],
		});
		expect(RegistryFamilyDetailSchema.parse(family)).toEqual(family);
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
		});
		expect(RegistryFamilyDetailSchema.parse(iconFamily)).toEqual(iconFamily);
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
		});
		expect(abelSummary).not.toHaveProperty('languages');
		expect(abelSummary).not.toHaveProperty('variable');
		const languageCatalog = views.get('languages.json');
		expect(languageCatalog).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'fa_Arab',
					sampleText: expect.any(Object),
				}),
			]),
		);
		expect(JSON.stringify(languageCatalog)).not.toContain('requiredCodepoints');
	}, 15_000);
});
