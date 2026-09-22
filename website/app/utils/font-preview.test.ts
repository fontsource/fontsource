import { describe, expect, it } from 'vitest';
import type { GetFontResponse } from '@/generated/api';
import {
	getFontFamilyStack,
	getFontPreviewCSS,
	getRegistrySourcePreviewCSS,
	selectRegistryPreviewSource,
} from './font-preview';
import type { RegistryFamily, RegistrySource } from './registry';

const registry: RegistryFamily = {
	id: 'example',
	family: 'Example',
	provider: 'fontsource',
	status: 'active',
	classifications: ['sans-serif'],
	tags: [],
	sourceModified: '2026-08-01',
	axes: [],
	languages: [],
	license: {
		id: 'OFL-1.1',
		url: 'https://example.com/license',
		text: 'License text',
	},
	provenance: { type: 'registry' },
	sources: [],
	previewSource: 'source',
	distribution: {
		static: [],
		characters: { type: 'all' },
	},
};

describe('getFontPreviewCSS', () => {
	it.each([false, true])(
		'preserves numbered subset ranges (variable: %s)',
		(isVariable) => {
			const metadata: GetFontResponse = {
				id: 'example',
				family: 'Example',
				subsets: ['korean', 'latin'],
				weights: [400],
				styles: ['normal'],
				defSubset: 'latin',
				variable: isVariable,
				lastModified: '2026-01-01',
				category: 'sans-serif',
				license: 'OFL-1.1',
				type: 'google',
				version: 'v1',
				source: 'https://example.com',
				variants: {},
				unicodeRange: {
					'[0]': 'U+AC00-ACFF',
					'[1]': 'U+AD00-ADFF',
					latin: 'U+0000-00FF',
				},
			};
			const css = getFontPreviewCSS(
				metadata,
				isVariable
					? {
							family: 'Example',
							axes: {
								wght: { default: '400', min: '100', max: '900', step: '1' },
							},
						}
					: undefined,
			);
			const suffix = isVariable ? 'wght' : '400';
			for (const [subset, range] of [
				['0', 'U+AC00-ACFF'],
				['1', 'U+AD00-ADFF'],
				['latin', 'U+0000-00FF'],
			]) {
				const face = css
					.split('}')
					.find((rule) => rule.includes(`/${subset}-${suffix}-normal.woff2`));
				expect(face).toContain(`unicode-range: ${range};`);
			}
		},
	);
});

describe('getFontFamilyStack', () => {
	it('uses the static family when variable metadata is unavailable', () => {
		const metadata = {
			id: 'fraunces',
			family: 'Fraunces',
			variable: true,
		};

		expect(getFontFamilyStack(metadata, false, registry)).toBe(
			'"Fraunces", "Fallback Outline"',
		);
		expect(getFontFamilyStack(metadata, true, registry)).toBe(
			'"Fraunces Variable", "Fallback Outline"',
		);
	});

	it('uses a Registry preview context instead of family IDs', () => {
		const metadata = {
			id: 'unrelated-name',
			family: 'Specialist',
			variable: false,
		};

		expect(
			getFontFamilyStack(metadata, false, {
				...registry,
				previewContext: {
					fallbackFamilies: ['Noto Sans JP', 'sans-serif'],
				},
			}),
		).toContain('"Noto Sans JP", sans-serif');
	});
});

describe('getRegistrySourcePreviewCSS', () => {
	const staticSource = {
		sha256: 'static-400',
		filename: 'example.ttf',
		path: 'files/example.ttf',
		format: 'ttf',
		size: 1,
		glyphCount: 1,
		codepointCount: 1,
		downloadUrl: '/v1/registry/sources/static-400',
		capabilitiesUrl: '/v1/registry/sources/static-400/capabilities',
		fontVersion: null,
		style: 'normal',
		type: 'static',
		weight: 400,
	} satisfies RegistrySource;

	it('loads the exact static Registry source', () => {
		expect(getRegistrySourcePreviewCSS(staticSource)).toMatchInlineSnapshot(`
			"@font-face {
			  font-family: 'Fontsource Registry Preview';
			  font-style: normal;
			  font-display: swap;
			  font-weight: 400;
			  src: url(https://api.fontsource.org/v1/registry/sources/static-400) format(truetype);
			}"
		`);
	});

	it('preserves a variable source weight range', () => {
		const source = {
			...staticSource,
			sha256: 'variable-standard',
			filename: 'example.otf',
			path: 'files/example.otf',
			format: 'otf',
			downloadUrl: '/v1/registry/sources/variable-standard',
			capabilitiesUrl: '/v1/registry/sources/variable-standard/capabilities',
			style: 'italic',
			type: 'variable',
			weight: { min: 100, max: 900, default: 450 },
			axes: [{ tag: 'wght', min: 100, max: 900, default: 450 }],
		} satisfies RegistrySource;

		expect(getRegistrySourcePreviewCSS(source)).toMatchInlineSnapshot(`
			"@font-face {
			  font-family: 'Fontsource Registry Preview';
			  font-style: italic;
			  font-display: swap;
			  font-weight: 100 900;
			  src: url(https://api.fontsource.org/v1/registry/sources/variable-standard) format(opentype);
			}"
		`);
	});

	it('keeps a variable weight range when the source declares a package variant', () => {
		const source = {
			...staticSource,
			sha256: 'variable-standard',
			filename: 'example.ttf',
			path: 'files/example.ttf',
			format: 'ttf',
			downloadUrl: '/v1/registry/sources/variable-standard',
			capabilitiesUrl: '/v1/registry/sources/variable-standard/capabilities',
			style: 'normal',
			declaredVariant: { weight: 400, style: 'normal' },
			type: 'variable',
			weight: { min: 100, max: 900, default: 400 },
			axes: [{ tag: 'wght', min: 100, max: 900, default: 400 }],
		} satisfies RegistrySource;

		expect(getRegistrySourcePreviewCSS(source)).toContain(
			'font-weight: 100 900;',
		);
		const previewCSS = getRegistrySourcePreviewCSS({
			...source,
			previewUrl: `${source.downloadUrl}/preview/1.woff2`,
		});
		expect(previewCSS).toMatchInlineSnapshot(`
			"@font-face {
			  font-family: 'Fontsource Registry Preview';
			  font-style: normal;
			  font-display: swap;
			  font-weight: 100 900;
			  src: url(https://api.fontsource.org/v1/registry/sources/variable-standard/preview/1.woff2) format(woff2), url(https://api.fontsource.org/v1/registry/sources/variable-standard) format(truetype);
			}"
		`);
	});

	it('supports a source-specific preview family name', () => {
		expect(
			getRegistrySourcePreviewCSS(staticSource, 'Preview static-400'),
		).toContain("font-family: 'Preview static-400';");
	});

	it('ignores an invalid source URL instead of breaking the preview', () => {
		expect(
			getRegistrySourcePreviewCSS({
				...staticSource,
				downloadUrl: 'https://%',
			}),
		).toBe('');
	});
});

describe('selectRegistryPreviewSource', () => {
	const staticNormal = {
		sha256: 'static-normal-400',
		filename: 'normal.ttf',
		path: 'files/normal.ttf',
		format: 'ttf',
		size: 1,
		glyphCount: 1,
		codepointCount: 1,
		downloadUrl: '/normal.ttf',
		capabilitiesUrl: '/normal.json',
		fontVersion: null,
		style: 'normal',
		type: 'static',
		weight: 400,
	} satisfies RegistrySource;
	const staticItalic = {
		...staticNormal,
		sha256: 'static-italic-700',
		filename: 'italic.ttf',
		downloadUrl: '/italic.ttf',
		capabilitiesUrl: '/italic.json',
		style: 'italic',
		weight: 700,
	} satisfies RegistrySource;
	const variableItalic = {
		...staticItalic,
		sha256: 'variable-italic',
		filename: 'italic-variable.ttf',
		downloadUrl: '/italic-variable.ttf',
		capabilitiesUrl: '/italic-variable.json',
		type: 'variable',
		weight: { min: 100, max: 900, default: 400 },
		axes: [{ tag: 'wght', min: 100, max: 900, default: 400 }],
	} satisfies RegistrySource;
	const family = {
		...registry,
		sources: [staticNormal, staticItalic, variableItalic],
		previewSource: staticNormal.sha256,
		distribution: {
			static: [
				{ weight: 400, style: 'normal', source: staticNormal.sha256 },
				{ weight: 700, style: 'italic', source: staticItalic.sha256 },
			],
			variable: [
				{
					axisKey: 'standard',
					style: 'italic',
					source: variableItalic.sha256,
				},
			],
			characters: { type: 'all' as const },
		},
	} satisfies RegistryFamily;

	it('follows the selected variable style source', () => {
		expect(
			selectRegistryPreviewSource(family, {
				variableAvailable: true,
				style: 'italic',
				weight: 600,
			}),
		).toBe(variableItalic);
	});

	it('uses the nearest distributed static source', () => {
		expect(
			selectRegistryPreviewSource(family, {
				variableAvailable: false,
				style: 'italic',
				weight: 600,
			}),
		).toBe(staticItalic);
	});

	it('falls back to the registry preview source', () => {
		expect(
			selectRegistryPreviewSource(family, {
				variableAvailable: true,
				style: 'normal',
				weight: 400,
			}),
		).toBe(staticNormal);
	});
});
