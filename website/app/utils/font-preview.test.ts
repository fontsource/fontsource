import { describe, expect, it } from 'vitest';
import type { GetFontResponse } from '@/generated/api';
import {
	getFontFamilyStack,
	getPreferredPreviewSubset,
	getPreviewDirection,
	getPreviewLanguageTag,
	getRegistrySourcePreviewCSS,
	selectRegistryPreviewSource,
} from './font-preview';
import type { RegistryFamily, RegistrySource } from './registry';

const registry = {
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
	sources: [],
	previewSource: 'source',
	distribution: {
		static: [],
		characters: { type: 'all' },
	},
} satisfies RegistryFamily;

describe('getFontFamilyStack', () => {
	it('uses the static family when variable metadata is unavailable', () => {
		const metadata = {
			id: 'fraunces',
			family: 'Fraunces',
			variable: true,
		};

		expect(getFontFamilyStack(metadata, false)).toBe(
			'"Fraunces", "Fallback Outline"',
		);
		expect(getFontFamilyStack(metadata, true)).toBe(
			'"Fraunces Variable", "Fallback Outline"',
		);
	});

	it('uses specialist registry tags instead of family IDs', () => {
		const metadata = {
			id: 'unrelated-name',
			family: 'Specialist',
			variable: false,
		};

		expect(
			getFontFamilyStack(metadata, false, {
				...registry,
				tags: ['special-use/punctuation'],
			}),
		).toContain('"Noto Sans JP", sans-serif');
		expect(
			getFontFamilyStack(metadata, false, {
				...registry,
				tags: ['special-use/digital-display'],
			}),
		).toContain('ui-monospace, monospace');
	});
});

describe('getPreferredPreviewSubset', () => {
	const metadata = {
		defSubset: 'latin',
		subsets: ['japanese', 'latin'],
	} as GetFontResponse;

	it('uses a distributed registry preview subset', () => {
		expect(
			getPreferredPreviewSubset(metadata, {
				...registry,
				previewSubset: 'japanese',
			}),
		).toBe('japanese');
	});

	it('falls back to the package default when no reviewed subset is available', () => {
		expect(getPreferredPreviewSubset(metadata, registry)).toBe('latin');
	});
});

describe('preview language semantics', () => {
	it('builds a BCP 47 tag from registry language and script metadata', () => {
		expect(getPreviewLanguageTag({ language: 'ar', script: 'Arab' })).toBe(
			'ar-Arab',
		);
		expect(getPreviewLanguageTag()).toBeUndefined();
	});

	it('preserves right-to-left direction for known preview subsets', () => {
		expect(getPreviewDirection('arabic')).toBe('rtl');
		expect(getPreviewDirection('latin')).toBe('ltr');
	});
});

describe('getRegistrySourcePreviewCSS', () => {
	it('loads the exact static Registry source', () => {
		const source = {
			sha256: 'static-400',
			filename: 'example.ttf',
			format: 'ttf',
			size: 1,
			downloadUrl: '/v1/registry/sources/static-400',
			capabilitiesUrl: '/v1/registry/sources/static-400/capabilities',
			fontVersion: null,
			style: 'normal',
			type: 'static',
			weight: 400,
		} satisfies RegistrySource;

		expect(getRegistrySourcePreviewCSS(source)).toContain(
			'src: url("https://api.fontsource.org/v1/registry/sources/static-400") format("truetype");',
		);
		expect(getRegistrySourcePreviewCSS(source)).toContain('font-weight: 400;');
	});

	it('preserves a variable source weight range', () => {
		const source = {
			sha256: 'variable-standard',
			filename: 'example.otf',
			format: 'otf',
			size: 1,
			downloadUrl: '/v1/registry/sources/variable-standard',
			capabilitiesUrl: '/v1/registry/sources/variable-standard/capabilities',
			fontVersion: null,
			style: 'italic',
			type: 'variable',
			weight: { min: 100, max: 900, default: 450 },
			axes: [{ tag: 'wght', min: 100, max: 900, default: 450 }],
		} satisfies RegistrySource;

		const css = getRegistrySourcePreviewCSS(source);
		expect(css).toContain('format("opentype")');
		expect(css).toContain('font-style: italic;');
		expect(css).toContain('font-weight: 100 900;');
	});

	it('keeps a variable weight range when the source declares a package variant', () => {
		const source = {
			sha256: 'variable-standard',
			filename: 'example.ttf',
			format: 'ttf',
			size: 1,
			downloadUrl: '/v1/registry/sources/variable-standard',
			capabilitiesUrl: '/v1/registry/sources/variable-standard/capabilities',
			fontVersion: null,
			style: 'normal',
			declaredVariant: { weight: 400, style: 'normal' },
			type: 'variable',
			weight: { min: 100, max: 900, default: 400 },
			axes: [{ tag: 'wght', min: 100, max: 900, default: 400 }],
		} satisfies RegistrySource;

		expect(getRegistrySourcePreviewCSS(source)).toContain(
			'font-weight: 100 900;',
		);
	});

	it('supports a source-specific preview family name', () => {
		const source = {
			sha256: 'static-400',
			filename: 'example.ttf',
			format: 'ttf',
			size: 1,
			downloadUrl: '/v1/registry/sources/static-400',
			capabilitiesUrl: '/v1/registry/sources/static-400/capabilities',
			fontVersion: null,
			style: 'normal',
			type: 'static',
			weight: 400,
		} satisfies RegistrySource;

		expect(getRegistrySourcePreviewCSS(source, 'Preview static-400')).toContain(
			'font-family: "Preview static-400";',
		);
	});
});

describe('selectRegistryPreviewSource', () => {
	const staticNormal = {
		sha256: 'static-normal-400',
		filename: 'normal.ttf',
		format: 'ttf',
		size: 1,
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
