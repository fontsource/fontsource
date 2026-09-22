import { describe, expect, it } from 'vitest';

import type { ResolvedFontSetFamily } from './model';
import { getCdnStylesheetUrl, getFontSetUsageCSS } from './output';

const baseItem: ResolvedFontSetFamily = {
	familyId: 'fraunces',
	family: 'Fraunces',
	classification: 'serif',
	designer: 'Undercase Type',
	packageName: '@fontsource-variable/fraunces',
	packageVersion: '5.3.0',
	fontFamily: 'Fraunces Variable',
	previewText: 'Make something memorable.',
	license: {
		id: 'OFL-1.1',
		url: 'https://openfontlicense.org',
	},
};

describe('font set output', () => {
	it('uses the standard package stylesheet for CDN and previews', () => {
		const stylesheet =
			'https://cdn.jsdelivr.net/npm/@fontsource-variable/fraunces@5.3.0/index.css';

		expect(getCdnStylesheetUrl(baseItem)).toBe(stylesheet);
	});

	it('applies exact family names without assigning design roles', () => {
		expect(
			getFontSetUsageCSS([
				baseItem,
				{ ...baseItem, familyId: 'inter', fontFamily: 'Inter Variable' },
			]),
		).toMatchInlineSnapshot(`
			".font-fraunces {
			  font-family: "Fraunces Variable";
			}

			.font-inter {
			  font-family: "Inter Variable";
			}"
		`);
	});
});
