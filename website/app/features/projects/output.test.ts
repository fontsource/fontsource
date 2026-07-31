import { describe, expect, it } from 'vitest';

import type { ProjectItem } from './model';
import {
	getCdnUrl,
	getFontStack,
	getProjectCss,
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
			familyId: 'material-symbols-outlined',
			category: 'icons' as const,
			cssFile: 'full.css',
			fontFamily: 'Material Symbols Outlined Variable',
		};

		expect(getCdnUrl(icon).endsWith('/full.css')).toBe(true);
		expect(getUsageBlock(icon)).toContain("font-feature-settings: 'liga';");
		expect(getUsageNote(icon)).toContain('icon names as ligatures');
	});

	it('uses specialist fallback and readout declarations', () => {
		const yakuHan = {
			...baseItem,
			familyId: 'yakuhanjp',
			fontFamily: 'Yaku Han JP',
		};
		const dseg = {
			...baseItem,
			familyId: 'dseg7-classic',
			category: 'display' as const,
			fontFamily: 'DSEG7 Classic',
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
