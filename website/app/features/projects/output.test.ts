import { describe, expect, it } from 'vitest';

import type { ProjectItem } from './model';
import {
	getCdnUrl,
	getFontStack,
	getProjectCdnUrls,
	getProjectCss,
	getProjectEditUrl,
	getSelectedCssFiles,
	getUsageBlock,
	getUsageNote,
} from './output';

const baseItem: ProjectItem = {
	familyId: 'fraunces',
	family: 'Fraunces',
	displayName: 'Fraunces',
	category: 'serif',
	classification: 'serif',
	tags: ['vintage'],
	designer: 'Undercase Type',
	status: 'active',
	registryFactsCurrent: true,
	format: 'variable',
	subset: 'latin',
	style: 'normal',
	weight: 600,
	axes: { wght: 600, SOFT: 50 },
	packageName: '@fontsource-variable/fraunces',
	packageVersion: '5.3.0',
	cssFile: 'latin-full.css',
	fontFamily: 'Fraunces Variable',
	sampleText: 'Make something memorable.',
	symbolInputModes: [],
	license: {
		verified: true,
		id: 'OFL-1.1',
		url: 'https://openfontlicense.org',
	},
};

describe('current project output', () => {
	it('pins package versions in CDN imports and preserves variable axes', () => {
		expect(getCdnUrl(baseItem)).toBe(
			'https://cdn.jsdelivr.net/npm/@fontsource-variable/fraunces@5.3.0/latin-full.css',
		);
		expect(getUsageBlock(baseItem)).toContain(
			"font-variation-settings: 'wght' 600, 'SOFT' 50;",
		);
		expect(getProjectCss([baseItem])).toContain(
			"@import url('https://cdn.jsdelivr.net/npm/@fontsource-variable/fraunces@5.3.0/latin-full.css');",
		);
		expect(getProjectCss([baseItem])).toContain(
			'Fraunces: OFL-1.1 (registry verified)',
		);
	});

	it('keeps the full stylesheet and ligature guidance for icon families', () => {
		const icon = {
			...baseItem,
			familyId: 'catalog-family',
			category: 'icons' as const,
			cssFile: 'full.css',
			fontFamily: 'Material Symbols Outlined Variable',
			symbolInputModes: [
				'codepoint',
				'name-ligature',
			] as ProjectItem['symbolInputModes'],
		};

		expect(getCdnUrl(icon).endsWith('/full.css')).toBe(true);
		expect(getSelectedCssFiles(icon, ['normal'], [400])).toEqual(['full.css']);
		expect(getUsageBlock(icon)).toContain("font-feature-settings: 'liga';");
		expect(getUsageNote(icon)).toContain('verified symbol names as ligatures');
	});

	it('builds every selected static and variable stylesheet', () => {
		expect(
			getSelectedCssFiles(
				{ ...baseItem, format: 'static', cssFile: 'latin-400.css' },
				['normal', 'italic'],
				[400, 700],
			),
		).toEqual([
			'latin-400.css',
			'latin-700.css',
			'latin-400-italic.css',
			'latin-700-italic.css',
		]);
		expect(getSelectedCssFiles(baseItem, ['normal', 'italic'], [400])).toEqual([
			'latin-full.css',
			'latin-full-italic.css',
		]);
	});

	it('preserves every saved stylesheet in combined output', () => {
		const configuredItem = {
			...baseItem,
			format: 'static' as const,
			packageName: '@fontsource/fraunces',
			cssFile: 'latin-400.css',
			cssFiles: [
				'latin-400.css',
				'latin-700.css',
				'latin-400-italic.css',
				'latin-700-italic.css',
			],
			styles: ['normal', 'italic'] as ProjectItem['styles'],
			weights: [400, 700],
		};

		expect(getProjectCdnUrls(configuredItem)).toHaveLength(4);
		expect(getProjectEditUrl(configuredItem)).toContain(
			'format=static&styles=normal%2Citalic&weights=400%2C700',
		);
		expect(getProjectCss([configuredItem])).toContain(
			"@import url('https://cdn.jsdelivr.net/npm/@fontsource/fraunces@5.3.0/latin-700-italic.css');",
		);
	});

	it('preserves generated font-face CSS and its editable setup', () => {
		const configuredItem = {
			...baseItem,
			subsets: ['latin', 'cyrillic'],
			activeAxes: ['wght', 'SOFT'],
			formats: ['woff2'] as ProjectItem['formats'],
			fontDisplay: 'optional' as const,
			packageFontFaceCSS: '@font-face { src: url(package-font.woff2); }',
			cdnFontFaceCSS: '@font-face { src: url(cdn-font.woff2); }',
		};

		const editUrl = getProjectEditUrl(configuredItem);
		expect(editUrl).toContain('subsets=latin%2Ccyrillic');
		expect(editUrl).toContain('activeAxes=wght%2CSOFT');
		expect(editUrl).toContain('display=optional');
		expect(getProjectCss([configuredItem])).toContain('cdn-font.woff2');
		expect(getProjectCss([configuredItem])).not.toContain('latin-full.css');
	});

	it('uses specialist fallback and readout declarations', () => {
		const yakuHan = {
			...baseItem,
			familyId: 'punctuation-helper',
			fontFamily: 'Yaku Han JP',
			tags: ['special-use/punctuation'],
		};
		const dseg = {
			...baseItem,
			familyId: 'digital-readout',
			category: 'display' as const,
			fontFamily: 'DSEG7 Classic',
			tags: ['special-use/digital-display'],
		};

		expect(getFontStack(yakuHan)).toBe(
			"'Yaku Han JP', 'Noto Sans JP', sans-serif",
		);
		expect(getUsageNote(yakuHan)).toContain('Punctuation only');
		expect(getUsageBlock(dseg)).toContain(
			'font-variant-numeric: tabular-nums;',
		);
		expect(getUsageBlock(dseg)).toContain("font-feature-settings: 'tnum';");
		expect(getUsageNote(dseg)).toContain('readout values stable');
	});

	it('escapes apostrophes in generated font stacks', () => {
		expect(
			getFontStack({
				...baseItem,
				fontFamily: 'Designer\u2019s Serif',
			}),
		).toBe("'Designer\u2019s Serif', serif");
	});
});
