import { beforeEach, describe, expect, it } from 'vitest';
import {
	RegistryAxesSchema,
	RegistryFamiliesSchema,
	RegistryFamilyDetailSchema,
	RegistryFamilySymbolsSchema,
	RegistryLanguagesSchema,
	RegistrySourceCapabilitiesSchema,
	RegistrySubsetSchema,
	RegistrySubsetsSchema,
	RegistryTaxonomySchema,
} from '../shared/registry';
import { dispatch, jsonSnapshot, setupWorkerTest, testEnv } from './helpers';

const REVISION = '1'.repeat(40);
const SOURCE_SHA256 = '2'.repeat(64);
const SOURCE_BYTES = new TextEncoder().encode('test font');
const FAMILY_SUMMARY = {
	id: 'abel',
	family: 'Abel',
	provider: 'google',
	status: 'active',
	classifications: ['sans-serif'],
	tags: ['sans/humanist'],
	sourceModified: '2026-07-15',
	axes: [],
} as const;
const VIEWS = [
	{
		path: 'families.json',
		route: '/v1/registry/families',
		body: RegistryFamiliesSchema.parse([FAMILY_SUMMARY]),
	},
	{
		path: 'families/abel.json',
		route: '/v1/registry/families/abel',
		body: RegistryFamilyDetailSchema.parse({
			...FAMILY_SUMMARY,
			languages: ['en_Latn'],
			primaryLanguage: 'en_Latn',
			primaryScript: 'Latn',
			sampleText: {
				short: 'All people are born free',
				long: 'All people are born free and equal',
			},
			license: {
				id: 'OFL-1.1',
				url: 'https://openfontlicense.org',
				text: 'Test license',
			},
			symbols: {
				catalogUrl: '/v1/registry/families/abel/symbols',
				inputModes: ['codepoint', 'name-ligature'],
			},
			distribution: {
				static: [{ weight: 400, style: 'normal', source: SOURCE_SHA256 }],
				characters: {
					type: 'subsets',
					defaultSubset: 'latin',
					subsets: [{ id: 'latin', definition: 'latin' }],
				},
			},
			sources: [
				{
					sha256: SOURCE_SHA256,
					filename: 'Abel-Regular.ttf',
					format: 'ttf',
					size: SOURCE_BYTES.byteLength,
					downloadUrl: `/v1/registry/sources/${SOURCE_SHA256}`,
					capabilitiesUrl: `/v1/registry/sources/${SOURCE_SHA256}/capabilities`,
					type: 'static',
					fontVersion: 'Version 1.0',
					weight: 400,
					style: 'normal',
					declaredVariant: { weight: 400, style: 'normal' },
				},
			],
		}),
	},
	{
		path: 'families/abel/symbols.json',
		route: '/v1/registry/families/abel/symbols',
		body: RegistryFamilySymbolsSchema.parse([
			{ name: 'home', codepoint: 0xe88a },
		]),
	},
	{
		path: 'languages.json',
		route: '/v1/registry/languages',
		body: RegistryLanguagesSchema.parse([
			{
				id: 'en_Latn',
				language: 'en',
				script: 'Latn',
				name: 'English',
				autonym: 'English',
				sampleText: {
					short: 'All people are born free',
					long: 'All people are born free and equal',
				},
			},
		]),
	},
	{
		path: 'taxonomy.json',
		route: '/v1/registry/taxonomy',
		body: RegistryTaxonomySchema.parse({
			classifications: {
				display: { label: 'Display' },
				handwriting: { label: 'Handwriting' },
				monospace: { label: 'Monospace' },
				'sans-serif': { label: 'Sans Serif' },
				serif: { label: 'Serif' },
				'slab-serif': { label: 'Slab Serif' },
				symbols: { label: 'Symbols' },
			},
			tagGroups: { sans: { label: 'Sans Serif' } },
			tags: { 'sans/humanist': { label: 'Humanist' } },
		}),
	},
	{
		path: 'subsets.json',
		route: '/v1/registry/subsets',
		body: RegistrySubsetsSchema.parse(['latin']),
	},
	{
		path: 'subsets/latin.json',
		route: '/v1/registry/subsets/latin',
		body: RegistrySubsetSchema.parse({
			id: 'latin',
			ranges: [['0000', '00FF']],
		}),
	},
	{
		path: 'axes.json',
		route: '/v1/registry/axes',
		body: RegistryAxesSchema.parse({
			wght: {
				name: 'Weight',
				description: 'Weight axis',
				min: 1,
				max: 1000,
				default: 400,
				precision: 0,
			},
		}),
	},
	{
		path: `sources/${SOURCE_SHA256}/capabilities.json`,
		route: `/v1/registry/sources/${SOURCE_SHA256}/capabilities`,
		body: RegistrySourceCapabilitiesSchema.parse({
			glyphCount: 2,
			codepointCount: 2,
			unicodeRange: 'U+0041-0042',
			features: {
				gsub: ['liga'],
				gpos: [],
			},
			outline: 'glyf',
			colorTables: [],
		}),
	},
] as const;

const putJson = async (key: string, value: unknown): Promise<void> => {
	await testEnv.REGISTRY.put(key, JSON.stringify(value));
};

const seedRegistry = async (): Promise<void> => {
	const prefix = `snapshots/${REVISION}/api`;
	const existing = await testEnv.REGISTRY.list();
	await Promise.all(
		existing.objects.map(({ key }) => testEnv.REGISTRY.delete(key)),
	);
	await Promise.all([
		putJson('current.json', {
			schemaVersion: 1,
			registryRevision: REVISION,
		}),
		...VIEWS.map(({ path, body }) => putJson(`${prefix}/${path}`, body)),
		testEnv.REGISTRY.put(`sources/sha256/${SOURCE_SHA256}`, SOURCE_BYTES, {
			httpMetadata: { contentType: 'font/ttf' },
		}),
	]);
};

describe('registry routes', () => {
	beforeEach(async () => {
		await setupWorkerTest();
		await seedRegistry();
	});

	it('serves the current registry views', async () => {
		const responses = await Promise.all(
			VIEWS.map(({ route }) => jsonSnapshot(`https://fontsource.test${route}`)),
		);

		expect(responses.map(({ body }) => body)).toEqual(
			VIEWS.map(({ body }) => body),
		);
		for (const response of responses) {
			expect(response.status).toBe(200);
			expect(response.headers.cacheControl).toBe('public, max-age=300');
			expect(response.headers.etag).toBe('<etag>');
		}
	});

	it('streams immutable source fonts and supports conditional requests', async () => {
		const url = `https://fontsource.test/v1/registry/sources/${SOURCE_SHA256}`;
		const first = await dispatch(url);
		const body = new Uint8Array(await first.response.arrayBuffer());
		await first.settle();

		expect(first.response.status).toBe(200);
		expect(body).toEqual(SOURCE_BYTES);
		expect(first.response.headers.get('Content-Type')).toBe('font/ttf');
		expect(first.response.headers.get('Cache-Control')).toBe(
			'public, max-age=31536000, immutable',
		);

		const second = await dispatch(
			new Request(url, {
				headers: {
					'If-None-Match': first.response.headers.get('ETag') ?? '',
				},
			}),
		);
		await second.settle();

		expect(second.response.status).toBe(304);
		expect(second.response.headers.get('ETag')).toBe(
			first.response.headers.get('ETag'),
		);
	});

	it('returns not found for unknown registry records', async () => {
		const responses = await Promise.all(
			[
				'/v1/registry/families/unknown',
				'/v1/registry/families/unknown/symbols',
				`/v1/registry/sources/${'8'.repeat(64)}`,
				`/v1/registry/sources/${'8'.repeat(64)}/capabilities`,
			].map((path) => jsonSnapshot(`https://fontsource.test${path}`)),
		);

		for (const response of responses) {
			expect(response).toMatchObject({
				status: 404,
				body: { status: 404 },
			});
		}
	});
});
