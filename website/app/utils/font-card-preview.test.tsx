import { MantineProvider } from '@mantine/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { RouterContextProvider, StaticRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FontCard } from '@/components/FontCard';
import {
	type GetRegistryFamilyResponse,
	getRegistryFamily,
} from '@/generated/api';
import { loader } from '@/routes/resources.font-preview.$id';

vi.mock('@/generated/api', () => ({ getRegistryFamily: vi.fn() }));

const family: GetRegistryFamilyResponse = {
	id: 'allkin',
	family: 'Allkin',
	provider: 'google',
	status: 'active',
	classifications: ['display'],
	tags: [],
	axes: [],
	languages: [],
	sourceModified: '2026-04-27',
	license: {
		id: 'OFL-1.1',
		url: 'https://openfontlicense.org',
		text: 'License',
	},
	provenance: { type: 'registry' },
	previewSource: 'allkin-source',
	distribution: {
		characters: { type: 'all' },
		static: [{ source: 'allkin-source', style: 'normal', weight: 400 }],
	},
	sources: [
		{
			sha256: 'allkin-source',
			filename: 'Allkin-Regular.ttf',
			path: 'Allkin-Regular.ttf',
			format: 'ttf',
			size: 64860,
			glyphCount: 200,
			codepointCount: 199,
			fontVersion: 'Version 1.010',
			type: 'static',
			style: 'normal',
			weight: 400,
			downloadUrl: '/v1/registry/sources/allkin-source',
			previewUrl: '/v1/registry/sources/allkin-source/preview/1.woff2',
			capabilitiesUrl: '/v1/registry/sources/allkin-source/capabilities',
		},
	],
};
const load = (id = 'allkin') =>
	loader({
		request: new Request(`https://fontsource.org/resources/font-preview/${id}`),
		params: { id },
		context: new RouterContextProvider(),
		url: new URL(`https://fontsource.org/resources/font-preview/${id}`),
		pattern: '/resources/font-preview/:id',
	});

beforeEach(() => {
	vi.resetAllMocks();
});

describe('card preview stylesheet', () => {
	it('serves a cached full-coverage registry face without package subset restrictions', async () => {
		vi.mocked(getRegistryFamily).mockResolvedValue(family);
		const response = await load();
		const css = await response.text();
		expect(response.headers.get('Content-Type')).toBe(
			'text/css; charset=utf-8',
		);
		expect(response.headers.get('Cache-Control')).toContain('max-age=300');
		expect(css).toContain('font-family: "Fontsource Card allkin"');
		expect(css).toContain(
			'https://api.fontsource.org/v1/registry/sources/allkin-source/preview/1.woff2',
		);
		expect(css).not.toContain('unicode-range');
	});
	it('rejects invalid family IDs', async () => {
		await expect(load('../allkin')).rejects.toMatchObject({ status: 404 });
	});
	it('rejects an unresolved preview source', async () => {
		vi.mocked(getRegistryFamily).mockResolvedValue({
			...family,
			previewSource: 'missing',
		});
		await expect(load()).rejects.toMatchObject({ status: 503 });
	});
});

describe('card stylesheet selection', () => {
	it.each([
		{
			id: 'allkin',
			sampleText: { short: '\uE000' },
			previewSubset: undefined,
			href: '/resources/font-preview/allkin',
		},
		{
			id: 'inter',
			sampleText: undefined,
			previewSubset: undefined,
			href: 'https://cdn.jsdelivr.net/fontsource/css/inter@latest/index.css',
		},
		{
			id: 'noto-sans-sc',
			sampleText: undefined,
			previewSubset: 'chinese-simplified',
			href: 'https://cdn.jsdelivr.net/fontsource/css/noto-sans-sc@latest/chinese-simplified.css',
		},
	])(
		'loads the appropriate preview for $id',
		({ id, sampleText, previewSubset, href }) => {
			const html = renderToStaticMarkup(
				<StaticRouter location="/">
					<MantineProvider>
						<FontCard
							font={{
								id,
								family: id,
								defSubset: 'latin',
								category: 'display',
								variable: false,
								sampleText,
								previewSubset,
							}}
							size={32}
							eagerStylesheet
						/>
					</MantineProvider>
				</StaticRouter>,
			);
			expect(html).toContain(`href="${href}"`);
		},
	);
});
