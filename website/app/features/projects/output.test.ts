import { describe, expect, it } from 'vitest';

import type { ResolvedFontSetFamily } from './model';
import { getCdnStylesheetUrl } from './output';

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
	it('uses the standard exact-version package stylesheet for CDN and previews', () => {
		const stylesheet =
			'https://cdn.jsdelivr.net/npm/@fontsource-variable/fraunces@5.3.0/index.css';

		expect(getCdnStylesheetUrl(baseItem)).toBe(stylesheet);
	});
});
