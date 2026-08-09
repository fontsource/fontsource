import { describe, expect, it } from 'vitest';

import type { ResolvedFontSetFamily } from './model';
import {
	getCdnStylesheetUrl,
	getFontStack,
	getPreviewCdnUrl,
	getUsageBlock,
	getUsageNote,
} from './output';

const baseItem: ResolvedFontSetFamily = {
	familyId: 'fraunces',
	family: 'Fraunces',
	displayName: 'Fraunces',
	category: 'serif',
	classification: 'serif',
	tags: ['vintage'],
	designer: 'Undercase Type',
	status: 'active',
	registryFactsCurrent: true,
	variableAvailable: true,
	defaultSubset: 'latin',
	format: 'variable',
	subset: 'latin',
	style: 'normal',
	weight: 600,
	axes: { wght: 600, SOFT: 50 },
	packageName: '@fontsource-variable/fraunces',
	packageVersion: '5.3.0',
	cssFile: 'wght.css',
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
	it('uses documented versioned CDN stylesheets and editable defaults', () => {
		expect(getCdnStylesheetUrl(baseItem)).toBe(
			'https://cdn.jsdelivr.net/fontsource/css/fraunces:vf@5.3.0/wght.css',
		);
		expect(getUsageBlock(baseItem)).not.toContain('font-variation-settings');
		expect(getUsageBlock(baseItem)).toMatch(/^\.font-fraunces \{/);
	});

	it('loads the aggregate package stylesheet for font-set specimens', () => {
		expect(getPreviewCdnUrl(baseItem)).toBe(
			'https://cdn.jsdelivr.net/fontsource/css/fraunces:vf@5.3.0/index.css',
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
			] as ResolvedFontSetFamily['symbolInputModes'],
		};

		expect(getCdnStylesheetUrl(icon).endsWith('/full.css')).toBe(true);
		expect(getUsageBlock(icon)).toContain("font-feature-settings: 'liga';");
		expect(getUsageNote(icon)).toContain('verified symbol names as ligatures');
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
